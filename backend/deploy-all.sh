#!/bin/bash

#######################################
# Deploy All Services Script
# Deploys all microservices in the correct order
# 
# Usage:
#   ./deploy-all.sh [-s dev] [-p profile-name] [-f]
#
# Options:
#   -s, --stage     Stage: dev, qa, uat, prod (default: dev)
#   -p, --profile   AWS profile (default: 1bt-training)
#   -f, --force     Force deployment
#   -h, --help      Show this help message
#######################################

set -e

# Default values
STAGE="dev"
AWS_PROFILE="${AWS_PROFILE:-1bt-training}"
FORCE=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Services in deployment order (dependencies first)
SERVICES=(
    "migration-service"
    "auth-service"
    "resource-service"
    "configuration-service"
    "project-service"
    "allocation-service"
    "report-service"
    "audit-service"
    "document-service"
)

# Help function
show_help() {
    cat << EOF
Deploy All Services Script

Usage: ./deploy-all.sh [-s <stage>] [-p <profile>] [-f]

Options:
    -s, --stage     Deployment stage: dev, qa, uat, prod (default: dev)
    -p, --profile   AWS profile (default: 1bt-training)
    -f, --force     Force deployment
    -h, --help      Show this help message

Examples:
    ./deploy-all.sh                    # Deploy all to dev
    ./deploy-all.sh -s qa              # Deploy all to qa
    ./deploy-all.sh -p my-profile      # Deploy using custom AWS profile
    ./deploy-all.sh -s dev -f          # Force deploy all to dev
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
        -p|--profile)
            AWS_PROFILE="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
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

# Validate stage
if [[ ! "$STAGE" =~ ^(dev|qa|uat|prod)$ ]]; then
    log_error "Invalid stage: $STAGE. Must be dev, qa, uat, or prod"
    exit 1
fi

# Export AWS profile
export AWS_PROFILE="$AWS_PROFILE"

# Display header
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  1BT Resource Management - Deploy All${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Stage:  $STAGE"
echo -e "Profile: $AWS_PROFILE"
echo -e "Force:  $FORCE"
echo -e "Services: ${#SERVICES[@]}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Track deployment
START_TIME=$(date +%s)
SUCCESSFUL=()
FAILED=()

# Deploy each service
for i in "${!SERVICES[@]}"; do
    SERVICE="${SERVICES[$i]}"
    SERVICE_PATH="$SCRIPT_DIR/services/$SERVICE"
    
    if [[ ! -d "$SERVICE_PATH" ]]; then
        log_warn "Service not found: $SERVICE - Skipping"
        continue
    fi
    
    echo ""
    log_info "[$((i + 1))/${#SERVICES[@]}] Deploying $SERVICE..."
    echo "----------------------------------------"
    
    cd "$SERVICE_PATH"
    
    # Build deploy command
    DEPLOY_CMD="npx serverless deploy --stage $STAGE --aws-profile $AWS_PROFILE"
    if [[ "$FORCE" == true ]]; then
        DEPLOY_CMD="$DEPLOY_CMD --force"
    fi
    
    if eval "$DEPLOY_CMD"; then
        log_success ">>> $SERVICE deployed successfully"
        SUCCESSFUL+=("$SERVICE")
    else
        log_error ">>> $SERVICE deployment failed"
        FAILED+=("$SERVICE")
    fi
    
    cd "$SCRIPT_DIR"
done

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Display summary
echo ""
log_info "============================================"
log_info "  Deployment Summary"
log_info "============================================"
log_success "Successful: ${#SUCCESSFUL[@]}/${#SERVICES[@]}"
for svc in "${SUCCESSFUL[@]}"; do
    log_success "  + $svc"
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
    log_error "Failed: ${#FAILED[@]}/${#SERVICES[@]}"
    for svc in "${FAILED[@]}"; do
        log_error "  - $svc"
    done
fi

log_info "Duration: ${MINUTES}m ${SECONDS}s"
log_info "============================================"

# Exit with error if any failed
if [[ ${#FAILED[@]} -gt 0 ]]; then
    exit 1
fi

