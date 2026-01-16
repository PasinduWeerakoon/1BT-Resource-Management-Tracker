#!/bin/bash
# =====================================================
# 1BT Resource Management - Infrastructure Deployment Script
# =====================================================
# Usage: ./deploy-infra.sh <environment> [options]
# Example: ./deploy-infra.sh dev
#          ./deploy-infra.sh prod --with-nat --multi-az-nat

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="${AWS_REGION:-ap-southeast-1}"
ENVIRONMENT="${1:-dev}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|uat|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, qa, uat, or prod${NC}"
    exit 1
fi

# Parse options
ENABLE_NAT="false"
ENABLE_MULTI_AZ_NAT="false"

for arg in "$@"; do
    case $arg in
        --with-nat)
            ENABLE_NAT="true"
            ;;
        --multi-az-nat)
            ENABLE_MULTI_AZ_NAT="true"
            ENABLE_NAT="true"
            ;;
    esac
done

# Cost warnings
echo -e "${YELLOW}=================================================${NC}"
echo -e "${YELLOW}Cost Estimate for $ENVIRONMENT Environment${NC}"
echo -e "${YELLOW}=================================================${NC}"

if [[ "$ENABLE_NAT" == "true" ]]; then
    if [[ "$ENABLE_MULTI_AZ_NAT" == "true" ]]; then
        echo -e "NAT Gateway (Multi-AZ): ~\$64/month + data transfer"
    else
        echo -e "NAT Gateway (Single): ~\$32/month + data transfer"
    fi
else
    echo -e "NAT Gateway: ${GREEN}Disabled (\$0)${NC}"
    echo -e "${YELLOW}Note: Lambda functions won't have internet access${NC}"
fi

case $ENVIRONMENT in
    dev|qa)
        echo -e "RDS (db.t3.micro): ~\$12/month"
        ;;
    uat)
        echo -e "RDS (db.t3.small): ~\$24/month"
        ;;
    prod)
        echo -e "RDS (db.t3.medium Multi-AZ): ~\$96/month"
        ;;
esac

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# =====================================================
# Step 1: Deploy VPC Stack
# =====================================================
echo -e "\n${GREEN}Step 1/3: Deploying VPC Stack...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/vpc-stack.yml \
    --stack-name "1bt-vpc-${ENVIRONMENT}" \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
        EnableNATGateway="${ENABLE_NAT}" \
        EnableMultiAZNAT="${ENABLE_MULTI_AZ_NAT}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${REGION}" \
    --tags \
        Project=1BT-Resource-Management \
        Environment="${ENVIRONMENT}"

echo -e "${GREEN}VPC Stack deployed successfully!${NC}"

# =====================================================
# Step 2: Create SSM Parameters (if not exists)
# =====================================================
echo -e "\n${GREEN}Step 2/3: Creating SSM Parameters...${NC}"

# Generate random password if not exists
if ! aws ssm get-parameter --name "/1bt/${ENVIRONMENT}/db-password" --region "${REGION}" &> /dev/null; then
    DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=')
    aws ssm put-parameter \
        --name "/1bt/${ENVIRONMENT}/db-password" \
        --type SecureString \
        --value "${DB_PASSWORD}" \
        --region "${REGION}" \
        --tags "Key=Environment,Value=${ENVIRONMENT}" "Key=Project,Value=1BT-Resource-Management"
    echo -e "Created DB password in SSM: /1bt/${ENVIRONMENT}/db-password"
else
    echo -e "DB password already exists in SSM"
    DB_PASSWORD=$(aws ssm get-parameter --name "/1bt/${ENVIRONMENT}/db-password" --with-decryption --query 'Parameter.Value' --output text --region "${REGION}")
fi

# Generate encryption key if not exists
if ! aws ssm get-parameter --name "/1bt/${ENVIRONMENT}/encryption-key" --region "${REGION}" &> /dev/null; then
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    aws ssm put-parameter \
        --name "/1bt/${ENVIRONMENT}/encryption-key" \
        --type SecureString \
        --value "${ENCRYPTION_KEY}" \
        --region "${REGION}" \
        --tags "Key=Environment,Value=${ENVIRONMENT}" "Key=Project,Value=1BT-Resource-Management"
    echo -e "Created encryption key in SSM: /1bt/${ENVIRONMENT}/encryption-key"
else
    echo -e "Encryption key already exists in SSM"
fi

# =====================================================
# Step 3: Deploy RDS Stack
# =====================================================
echo -e "\n${GREEN}Step 3/3: Deploying RDS Stack...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/rds-stack.yml \
    --stack-name "1bt-rds-${ENVIRONMENT}" \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
        DBMasterUsername="dbadmin" \
        DBMasterPassword="${DB_PASSWORD}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${REGION}" \
    --tags \
        Project=1BT-Resource-Management \
        Environment="${ENVIRONMENT}"

echo -e "${GREEN}RDS Stack deployed successfully!${NC}"

# =====================================================
# Summary
# =====================================================
echo -e "\n${GREEN}=================================================${NC}"
echo -e "${GREEN}Infrastructure Deployment Complete!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo "Outputs:"
echo "--------"
aws cloudformation describe-stacks --stack-name "1bt-vpc-${ENVIRONMENT}" --query 'Stacks[0].Outputs' --output table --region "${REGION}"
echo ""
aws cloudformation describe-stacks --stack-name "1bt-rds-${ENVIRONMENT}" --query 'Stacks[0].Outputs' --output table --region "${REGION}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Wait for RDS to be available (~10-15 minutes)"
echo "2. Run database migrations: npm run migrate:up"
echo "3. Deploy Serverless application: npm run deploy:${ENVIRONMENT}"
