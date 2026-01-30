#!/bin/bash

#######################################
# Update Layer Version Script
# Updates all services to use a specific layer version and optionally deploys
# 
# Usage:
#   ./update-layer.sh -v <version> [-d] [-s dev] [-p profile-name]
#
# Options:
#   -v, --version   Layer version (required)
#   -d, --deploy    Deploy all services after update
#   -s, --stage     Stage: dev, qa, uat, prod (default: dev)
#   -p, --profile   AWS profile (default: 1bt-training)
#   -h, --help      Show this help message
#######################################

set -e

# Default values
VERSION=""
DEPLOY=false
STAGE="dev"
AWS_PROFILE="${AWS_PROFILE:-1bt-training}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_error() { echo -e "\033[0;31m[ERROR]${NC} $1"; }

# Help function
show_help() {
    cat << EOF
Update Layer Version Script

Usage: ./update-layer.sh -v <version> [-d] [-s <stage>] [-p <profile>]

Options:
    -v, --version   Layer version number (required)
    -d, --deploy    Deploy all services after update
    -s, --stage     Deployment stage: dev, qa, uat, prod (default: dev)
    -p, --profile   AWS profile (default: 1bt-training)
    -h, --help      Show this help message

Examples:
    ./update-layer.sh -v 31                    # Update to version 31
    ./update-layer.sh -v 31 -d                 # Update and deploy
    ./update-layer.sh -v 31 -s qa -p my-profile # Update for qa with custom profile
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -d|--deploy)
            DEPLOY=true
            shift
            ;;
        -s|--stage)
            STAGE="$2"
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

# Validate version
if [[ -z "$VERSION" ]]; then
    log_error "Version is required. Use -v or --version"
    show_help
fi

if ! [[ "$VERSION" =~ ^[0-9]+$ ]]; then
    log_error "Version must be a number"
    exit 1
fi

# Validate stage
if [[ ! "$STAGE" =~ ^(dev|qa|uat|prod)$ ]]; then
    log_error "Invalid stage: $STAGE. Must be dev, qa, uat, or prod"
    exit 1
fi

# Export AWS profile
export AWS_PROFILE="$AWS_PROFILE"

# Services directory
SERVICES_DIR="$SCRIPT_DIR/services"

log_info "Updating all services to layer version $VERSION..."

# Find all serverless.yml files and update layer version
UPDATED_COUNT=0
while IFS= read -r -d '' file; do
    # Read file content
    CONTENT=$(cat "$file")
    
    # Pattern to match: onebt-shared-libs-${self:provider.stage}:<number>
    # Replace with new version
    NEW_CONTENT=$(echo "$CONTENT" | sed "s/onebt-shared-libs-\${self:provider\.stage}:[0-9]*/onebt-shared-libs-\${self:provider.stage}:$VERSION/g")
    
    # Check if content changed
    if [[ "$CONTENT" != "$NEW_CONTENT" ]]; then
        echo "$NEW_CONTENT" > "$file"
        log_success "Updated: $file"
        ((UPDATED_COUNT++))
    fi
done < <(find "$SERVICES_DIR" -name "serverless.yml" -type f -print0)

if [[ $UPDATED_COUNT -eq 0 ]]; then
    log_info "No files needed updating"
else
    log_success ""
    log_success "All services updated to layer version $VERSION"
fi

# Deploy if requested
if [[ "$DEPLOY" == true ]]; then
    echo ""
    log_info "Starting deployment..."
    "$SCRIPT_DIR/deploy-all.sh" -s "$STAGE" -p "$AWS_PROFILE"
fi

