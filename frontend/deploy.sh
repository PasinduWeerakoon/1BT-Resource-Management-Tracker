#!/bin/bash

# RM Frontend Deployment Script (single script for all environments)
# Build uses REACT_APP_ENV → API URL from src/api/config.js (dev/qa/prod).
# Deploys to S3 + CloudFront; each env has its own stack.
#
# Usage:
#   ./deploy.sh                    # Deploy dev (default)
#   ./deploy.sh qa                 # Deploy QA
#   ./deploy.sh prod               # Deploy prod
#   REACT_APP_ENV=qa ./deploy.sh   # Same as ./deploy.sh qa (env var sets target)
#   ./deploy.sh qa --profile x     # QA with AWS profile x

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure aws CLI from the project venv is on PATH
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
if [ -d "$PROJECT_ROOT/.venv/bin" ]; then
    export PATH="$PROJECT_ROOT/.venv/bin:$PATH"
fi

# Default AWS profile and allowed envs
DEFAULT_AWS_PROFILE="rmproject"
VALID_ENVS="dev qa prod"

# Parse command-line arguments
ENVIRONMENT=""
AWS_PROFILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|qa|prod)
            if [ -n "$ENVIRONMENT" ]; then
                echo -e "${RED}Error: Environment specified more than once${NC}"
                exit 1
            fi
            ENVIRONMENT="$1"
            shift
            ;;
        --profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        --rmproject)
            AWS_PROFILE="$DEFAULT_AWS_PROFILE"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [ENV] [OPTIONS]"
            echo ""
            echo "Environments (optional, default: dev):"
            echo "  dev    Development (default)"
            echo "  qa     QA"
            echo "  prod   Production"
            echo ""
            echo "Options:"
            echo "  --profile PROFILE_NAME    AWS profile (default: rmproject)"
            echo "  --rmproject              Shortcut for --profile rmproject"
            echo "  --help, -h                Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                  # Deploy dev"
            echo "  $0 qa               # Deploy QA"
            echo "  REACT_APP_ENV=qa $0 # Same (env var = build + deploy target)"
            echo "  $0 prod --profile prod"
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option or invalid env: $1${NC}"
            echo "Use --help for usage. Valid envs: $VALID_ENVS"
            exit 1
            ;;
    esac
done

# Defaults: use REACT_APP_ENV if set and valid, else dev
if [ -z "$ENVIRONMENT" ]; then
    if [ -n "${REACT_APP_ENV:-}" ] && [[ " $VALID_ENVS " == *" $REACT_APP_ENV "* ]]; then
        ENVIRONMENT="$REACT_APP_ENV"
    else
        ENVIRONMENT="dev"
    fi
fi
[ -z "$AWS_PROFILE" ] && AWS_PROFILE="$DEFAULT_AWS_PROFILE"

# Configuration (per-env stack so dev/qa/prod can coexist)
PROJECT_NAME="rm-frontend"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-stack"
REGION="ap-southeast-1"
BUILD_DIR="dist"

AWS_PROFILE_ARGS="--profile $AWS_PROFILE"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RM Frontend Deployment — ${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Environment : ${ENVIRONMENT}${NC}"
echo -e "${YELLOW}AWS Profile : ${AWS_PROFILE}${NC}"
echo -e "${YELLOW}Stack       : ${STACK_NAME}${NC}"
echo -e "${YELLOW}Region      : ${REGION}${NC}"
echo ""

# ── Pre-flight checks ──────────────────────────────────────────────

# 1. Check AWS CLI
echo -n "Checking AWS CLI... "
if ! command -v aws &> /dev/null; then
    echo -e "${RED}NOT FOUND${NC}"
    echo ""
    echo "AWS CLI is not installed or not on PATH."
    echo "  - If installed via .venv: source $PROJECT_ROOT/.venv/bin/activate"
    echo "  - Or install: https://aws.amazon.com/cli/"
    exit 1
fi
AWS_VERSION=$(aws --version 2>&1)
echo -e "${GREEN}OK${NC} ($AWS_VERSION)"

# 2. Check AWS credentials (|| true prevents exit on failure)
echo -n "Checking AWS credentials (profile: $AWS_PROFILE)... "
AWS_CHECK=$(aws sts get-caller-identity $AWS_PROFILE_ARGS 2>&1) || true

if echo "$AWS_CHECK" | grep -q "Account"; then
    AWS_ACCOUNT=$(echo "$AWS_CHECK" | grep -o '"Account"[^,]*' | cut -d'"' -f4)
    echo -e "${GREEN}OK${NC} (Account: $AWS_ACCOUNT)"
else
    echo -e "${RED}FAILED${NC}"
    echo ""
    echo "AWS error output:"
    echo "  $AWS_CHECK"
    echo ""
    # Try default credentials as fallback
    echo -n "Trying default credentials (no --profile)... "
    DEFAULT_CHECK=$(aws sts get-caller-identity 2>&1) || true
    if echo "$DEFAULT_CHECK" | grep -q "Account"; then
        echo -e "${GREEN}OK${NC}"
        echo -e "${YELLOW}Continuing with default credentials instead of profile '$AWS_PROFILE'.${NC}"
        AWS_PROFILE=""
        AWS_PROFILE_ARGS=""
    else
        echo -e "${RED}FAILED${NC}"
        echo ""
        echo "Neither profile '$AWS_PROFILE' nor default credentials work."
        echo ""
        echo "To fix:"
        echo "  aws configure --profile $DEFAULT_AWS_PROFILE"
        echo "  # or just: aws configure"
        exit 1
    fi
fi

echo ""

# ── Step 1: Build ───────────────────────────────────────────────────

echo -e "${YELLOW}Step 1: Building React app for '${ENVIRONMENT}'...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this script from the frontend directory.${NC}"
    exit 1
fi

export REACT_APP_ENV="$ENVIRONMENT"
if [ -n "${REACT_APP_API_BASE_URL:-}" ]; then
    export REACT_APP_API_BASE_URL
    echo "  API Base URL (override): ${REACT_APP_API_BASE_URL}"
else
    echo "  REACT_APP_ENV=${REACT_APP_ENV} (API URL from src/api/config.js)"
fi

npm install || { echo -e "${RED}Error: npm install failed${NC}"; exit 1; }
npm run build || { echo -e "${RED}Error: npm run build failed${NC}"; exit 1; }

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory '$BUILD_DIR' not found. Build may have failed.${NC}"
    exit 1
fi

echo -e "${GREEN}Build completed successfully${NC}"
echo ""

# ── Step 2: CloudFormation stack ────────────────────────────────────

echo -e "${YELLOW}Step 2: Deploying/Updating CloudFormation stack ($STACK_NAME)...${NC}"

STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null || echo "NOT_FOUND")

echo "  Current stack status: $STACK_STATUS"

# Handle failed stacks
if [ "$STACK_STATUS" != "NOT_FOUND" ] && ([[ "$STACK_STATUS" == *"ROLLBACK"* ]] || [[ "$STACK_STATUS" == *"FAILED"* ]]); then
    echo -e "${YELLOW}  Found failed stack, deleting before re-create...${NC}"

    aws cloudformation delete-stack \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        $AWS_PROFILE_ARGS

    echo "  Waiting for deletion..."
    aws cloudformation wait stack-delete-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        $AWS_PROFILE_ARGS || {
        echo -e "${RED}Error: Stack deletion timed out. Try again in a few minutes.${NC}"
        exit 1
    }

    echo -e "${GREEN}  Failed stack deleted${NC}"
    STACK_STATUS="NOT_FOUND"
fi

# Create or update stack
if [ "$STACK_STATUS" == "NOT_FOUND" ]; then
    echo "  Creating new stack..."
    aws cloudformation create-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation.yaml \
        --parameters ParameterKey=ProjectName,ParameterValue="${PROJECT_NAME}-${ENVIRONMENT}" \
        --capabilities CAPABILITY_IAM \
        --region "$REGION" \
        $AWS_PROFILE_ARGS || { echo -e "${RED}Error: Stack creation failed${NC}"; exit 1; }

    echo "  Waiting for stack creation (this may take a few minutes)..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        $AWS_PROFILE_ARGS || { echo -e "${RED}Error: Stack creation timed out${NC}"; exit 1; }

    echo -e "${GREEN}  Stack created successfully${NC}"
elif [[ "$STACK_STATUS" == *"COMPLETE"* ]] && [[ "$STACK_STATUS" != *"DELETE"* ]]; then
    echo "  Stack exists, checking for updates..."

    UPDATE_OUTPUT=$(aws cloudformation update-stack \
        --stack-name "$STACK_NAME" \
        --template-body file://cloudformation.yaml \
        --parameters ParameterKey=ProjectName,ParameterValue="${PROJECT_NAME}-${ENVIRONMENT}" \
        --capabilities CAPABILITY_IAM \
        --region "$REGION" \
        $AWS_PROFILE_ARGS 2>&1) || true

    if echo "$UPDATE_OUTPUT" | grep -q "No updates are to be performed"; then
        echo -e "${GREEN}  Stack is up to date (no changes)${NC}"
    elif echo "$UPDATE_OUTPUT" | grep -q "StackId"; then
        echo "  Update initiated, waiting..."
        aws cloudformation wait stack-update-complete \
            --stack-name "$STACK_NAME" \
            --region "$REGION" \
            $AWS_PROFILE_ARGS || true
        echo -e "${GREEN}  Stack updated${NC}"
    else
        echo -e "${YELLOW}  Stack update note: ${UPDATE_OUTPUT}${NC}"
    fi
else
    echo -e "${YELLOW}  Stack in state '$STACK_STATUS', waiting for it to settle...${NC}"
    sleep 10
fi

echo -e "${GREEN}CloudFormation stack ready${NC}"
echo ""

# ── Step 3: Get S3 bucket name ──────────────────────────────────────

echo -e "${YELLOW}Step 3: Getting S3 bucket name...${NC}"
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS \
    --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" \
    --output text) || { echo -e "${RED}Error: Could not get S3 bucket name${NC}"; exit 1; }

if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" = "None" ]; then
    echo -e "${RED}Error: S3 bucket name is empty. Check CloudFormation stack outputs.${NC}"
    exit 1
fi

echo "  S3 Bucket: $S3_BUCKET"
echo ""

# ── Step 4: Upload to S3 ───────────────────────────────────────────

echo -e "${YELLOW}Step 4: Uploading files to S3...${NC}"

# Assets with long cache
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS || { echo -e "${RED}Error: S3 upload failed${NC}"; exit 1; }

# HTML with no-cache (SPA)
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET" \
    --delete \
    --cache-control "no-cache, no-store, must-revalidate" \
    --exclude "*" \
    --include "*.html" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS || { echo -e "${RED}Error: S3 HTML upload failed${NC}"; exit 1; }

echo -e "${GREEN}Files uploaded to S3${NC}"
echo ""

# ── Step 5: Get CloudFront Distribution ID ──────────────────────────

echo -e "${YELLOW}Step 5: Getting CloudFront Distribution ID...${NC}"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
    --output text) || { echo -e "${RED}Error: Could not get CloudFront Distribution ID${NC}"; exit 1; }

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
    echo -e "${RED}Error: CloudFront Distribution ID is empty${NC}"
    exit 1
fi

echo "  Distribution ID: $DISTRIBUTION_ID"
echo ""

# ── Step 6: CloudFront invalidation ────────────────────────────────

echo -e "${YELLOW}Step 6: Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    $AWS_PROFILE_ARGS \
    --query "Invalidation.Id" \
    --output text) || { echo -e "${RED}Error: CloudFront invalidation failed${NC}"; exit 1; }

echo "  Invalidation ID: $INVALIDATION_ID"
echo "  Waiting for invalidation to complete (this may take a few minutes)..."

aws cloudfront wait invalidation-completed \
    --distribution-id "$DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID" \
    $AWS_PROFILE_ARGS || true

echo -e "${GREEN}Invalidation completed${NC}"
echo ""

# ── Done ────────────────────────────────────────────────────────────

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    $AWS_PROFILE_ARGS \
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
    --output text) || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment completed!  (${ENVIRONMENT})${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
if [ -n "$CLOUDFRONT_URL" ] && [ "$CLOUDFRONT_URL" != "None" ]; then
    echo -e "  URL: ${GREEN}${CLOUDFRONT_URL}${NC}"
else
    echo -e "  ${YELLOW}URL not available yet. Check CloudFormation outputs.${NC}"
fi
echo ""
echo -e "${YELLOW}Note: Changes may take a few minutes to propagate globally.${NC}"
