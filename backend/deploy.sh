#!/bin/bash

#######################################
# 1BT Resource Management - Deployment Script
# 
# Deploys all infrastructure and microservices in the correct order.
# Uses a single infrastructure stack for VPC, RDS, Cognito, and API Gateway.
#
# Usage:
#   ./deploy.sh -s dev -a deploy              # Deploy all services to dev
#   ./deploy.sh -s dev -a deploy -c auth      # Deploy only auth service
#   ./deploy.sh -s dev -a remove              # Remove all services
#   ./deploy.sh -s dev -a status              # Check deployment status
#
# Options:
#   -s, --stage     Stage: dev, qa, uat, prod (required)
#   -a, --action    Action: deploy, remove, status (default: deploy)
#   -c, --service   Specific service (optional)
#   -r, --region    AWS region (default: ap-southeast-1)
#   -p, --profile   AWS profile (default: 1bt-training)
#   -h, --help      Show this help message
#######################################

set -e

# Default values
STAGE=""
ACTION="deploy"
SERVICE=""
REGION="ap-southeast-1"
AWS_PROFILE="${AWS_PROFILE:-1bt-training}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Service definitions (order matters for deployment)
declare -a SERVICE_ORDER=("infrastructure" "shared" "auth" "resource" "configuration" "project" "allocation" "report" "document")

declare -A SERVICE_PATHS=(
    ["infrastructure"]="infrastructure"
    ["shared"]="shared"
    ["auth"]="services/auth-service"
    ["resource"]="services/resource-service"
    ["configuration"]="services/configuration-service"
    ["project"]="services/project-service"
    ["allocation"]="services/allocation-service"
    ["report"]="services/report-service"
    ["document"]="services/document-service"
)

declare -A SERVICE_DESCRIPTIONS=(
    ["infrastructure"]="VPC, RDS, Cognito, API Gateway"
    ["shared"]="Shared Lambda Layer"
    ["auth"]="Authentication Service"
    ["resource"]="Resource Management Service"
    ["configuration"]="Configuration & Master Data Service"
    ["project"]="Project & Client Service"
    ["allocation"]="Allocation Service"
    ["report"]="Reporting Service"
    ["document"]="Document Generation Service (Python)"
)

# Logging functions
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${MAGENTA}=== $1 ===${NC}"; }

# Help function
show_help() {
    cat << EOF
1BT Resource Management - Deployment Script

Usage: ./deploy.sh -s <stage> [-a <action>] [-c <service>] [-r <region>]

Options:
    -s, --stage     Deployment stage: dev, qa, uat, prod (required)
    -a, --action    Action to perform: deploy, remove, status (default: deploy)
    -c, --service   Specific service to target (optional):
                    infrastructure, shared, auth, resource, configuration,
                    project, allocation, report, document
    -r, --region    AWS region (default: ap-southeast-1)
    -p, --profile   AWS profile (default: 1bt-training)
    -h, --help      Show this help message

Examples:
    ./deploy.sh -s dev -a deploy                      # Deploy all to dev
    ./deploy.sh -s dev -a deploy -c auth              # Deploy only auth service
    ./deploy.sh -s dev -a deploy -p my-profile       # Deploy using custom AWS profile
    ./deploy.sh -s prod -a status                     # Check prod status
    ./deploy.sh -s dev -a remove                      # Remove all from dev
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--stage)
            STAGE="$2"
            shift 2
            ;;
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -c|--service)
            SERVICE="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Validate required parameters
if [[ -z "$STAGE" ]]; then
    log_error "Stage is required. Use -s or --stage"
    show_help
fi

if [[ ! "$STAGE" =~ ^(dev|qa|uat|prod)$ ]]; then
    log_error "Invalid stage: $STAGE. Must be dev, qa, uat, or prod"
    exit 1
fi

if [[ ! "$ACTION" =~ ^(deploy|remove|status)$ ]]; then
    log_error "Invalid action: $ACTION. Must be deploy, remove, or status"
    exit 1
fi

if [[ -n "$SERVICE" && -z "${SERVICE_PATHS[$SERVICE]}" ]]; then
    log_error "Invalid service: $SERVICE"
    log_info "Valid services: ${SERVICE_ORDER[*]}"
    exit 1
fi

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
        exit 1
    fi
    log_success "AWS CLI: $(aws --version 2>&1 | head -1)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js 20+"
        exit 1
    fi
    log_success "Node.js: $(node --version)"
    
    # Check Serverless Framework
    if ! npx serverless --version &> /dev/null; then
        log_error "Serverless Framework not found. Run: npm install -g serverless"
        exit 1
    fi
    log_success "Serverless: $(npx serverless --version 2>&1 | head -1)"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity --profile "$AWS_PROFILE" &> /dev/null; then
        log_error "AWS credentials not configured for profile: $AWS_PROFILE. Run: aws configure --profile $AWS_PROFILE"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)
    local user_arn=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Arn --output text)
    log_success "AWS Profile: $AWS_PROFILE"
    log_success "AWS Account: $account_id"
    log_success "AWS User/Role: $user_arn"
}

# Deploy a single service
deploy_service() {
    local service_name=$1
    local service_path="${SERVICE_PATHS[$service_name]}"
    local full_path="$SCRIPT_DIR/$service_path"
    
    if [[ ! -d "$full_path" ]]; then
        log_error "Service path not found: $full_path"
        return 1
    fi
    
    log_info "Deploying $service_name from $service_path using profile $AWS_PROFILE..."
    
    cd "$full_path"
    
    # Export AWS profile for serverless framework
    export AWS_PROFILE="$AWS_PROFILE"
    
    if npx serverless deploy --stage "$STAGE" --region "$REGION" --aws-profile "$AWS_PROFILE" --verbose; then
        log_success "$service_name deployed successfully"
        cd "$SCRIPT_DIR"
        return 0
    else
        log_error "Deployment failed for $service_name"
        cd "$SCRIPT_DIR"
        return 1
    fi
}

# Remove a single service
remove_service() {
    local service_name=$1
    local service_path="${SERVICE_PATHS[$service_name]}"
    local full_path="$SCRIPT_DIR/$service_path"
    
    if [[ ! -d "$full_path" ]]; then
        log_warn "Service path not found: $full_path (may already be removed)"
        return 0
    fi
    
    log_info "Removing $service_name..."
    
    cd "$full_path"
    
    # Export AWS profile for serverless framework
    export AWS_PROFILE="$AWS_PROFILE"
    
    if npx serverless remove --stage "$STAGE" --region "$REGION" --aws-profile "$AWS_PROFILE" 2>&1; then
        log_success "$service_name removed"
    else
        log_warn "Error removing $service_name (may not exist)"
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

# Get service status
get_service_status() {
    local service_name=$1
    local service_path="${SERVICE_PATHS[$service_name]}"
    local full_path="$SCRIPT_DIR/$service_path"
    
    if [[ ! -d "$full_path" ]]; then
        log_warn "$service_name - Path not found"
        return
    fi
    
    cd "$full_path"
    
    # Export AWS profile for serverless framework
    export AWS_PROFILE="$AWS_PROFILE"
    
    if npx serverless info --stage "$STAGE" --region "$REGION" --aws-profile "$AWS_PROFILE" 2>&1; then
        log_success "$service_name - Deployed"
    else
        log_warn "$service_name - Not deployed"
    fi
    
    cd "$SCRIPT_DIR"
}

# Get services to process
get_services_to_process() {
    if [[ -n "$SERVICE" ]]; then
        echo "$SERVICE"
    else
        echo "${SERVICE_ORDER[@]}"
    fi
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  1BT Resource Management Deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "Stage:  $STAGE"
    echo -e "Action: $ACTION"
    echo -e "Region: $REGION"
    echo -e "Profile: $AWS_PROFILE"
    if [[ -n "$SERVICE" ]]; then
        echo -e "Service: $SERVICE"
    fi
    echo ""
    
    check_prerequisites
    
    local services=($(get_services_to_process))
    
    case $ACTION in
        deploy)
            log_step "Starting Deployment"
            
            local failed=""
            for svc in "${services[@]}"; do
                log_step "Deploying: $svc - ${SERVICE_DESCRIPTIONS[$svc]}"
                
                if ! deploy_service "$svc"; then
                    failed="$svc"
                    log_error "Deployment stopped due to failure in $svc"
                    break
                fi
            done
            
            echo ""
            if [[ -z "$failed" ]]; then
                log_success "All services deployed successfully!"
                
                # Get API endpoint
                local api_endpoint=$(aws cloudformation describe-stacks \
                    --stack-name "onebt-infrastructure-$STAGE" \
                    --query "Stacks[0].Outputs[?OutputKey=='HttpApiEndpoint'].OutputValue" \
                    --output text \
                    --region "$REGION" \
                    --profile "$AWS_PROFILE" 2>/dev/null || echo "")
                
                if [[ -n "$api_endpoint" && "$api_endpoint" != "None" ]]; then
                    echo -e "\n${GREEN}API Endpoint: $api_endpoint${NC}"
                fi
            else
                log_error "Deployment failed. Failed service: $failed"
                exit 1
            fi
            ;;
            
        remove)
            log_step "Starting Removal (Reverse Order)"
            
            if [[ -z "$SERVICE" ]]; then
                log_warn "This will remove ALL services and infrastructure for stage: $STAGE"
                read -p "Are you sure? (yes/no): " confirm
                if [[ "$confirm" != "yes" ]]; then
                    log_info "Removal cancelled"
                    exit 0
                fi
            fi
            
            # Reverse the order for removal
            local reversed_services=()
            for ((i=${#services[@]}-1; i>=0; i--)); do
                reversed_services+=("${services[$i]}")
            done
            
            for svc in "${reversed_services[@]}"; do
                log_step "Removing: $svc"
                remove_service "$svc"
            done
            
            log_success "Removal complete!"
            ;;
            
        status)
            log_step "Checking Deployment Status"
            
            for svc in "${services[@]}"; do
                echo ""
                log_info "Checking: $svc - ${SERVICE_DESCRIPTIONS[$svc]}"
                get_service_status "$svc"
            done
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Deployment Complete${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Run main function
main
