#!/bin/bash

#######################################
# Build and Publish Layer Script
# Builds the shared layer and publishes to AWS Lambda
# 
# Usage:
#   ./publish-layer.sh [-s dev] [-r nodejs22.x] [-p profile-name]
#
# Options:
#   -s, --stage     Stage: dev, qa, uat, prod (default: dev)
#   -r, --runtime   Runtime: nodejs22.x (default: nodejs22.x)
#   -p, --profile   AWS profile (default: 1bt-training)
#   -h, --help      Show this help message
#######################################

set -e

# Default values
STAGE="dev"
RUNTIME="nodejs22.x"
AWS_PROFILE="${AWS_PROFILE:-1bt-training}"
REGION="ap-southeast-1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Help function
show_help() {
    cat << EOF
Build and Publish Lambda Layer Script

Usage: ./publish-layer.sh [-s <stage>] [-r <runtime>] [-p <profile>]

Options:
    -s, --stage     Deployment stage: dev, qa, uat, prod (default: dev)
    -r, --runtime   Lambda runtime (default: nodejs22.x)
    -p, --profile   AWS profile (default: 1bt-training)
    -h, --help      Show this help message

Examples:
    ./publish-layer.sh                    # Build and publish to dev
    ./publish-layer.sh -s qa             # Build and publish to qa
    ./publish-layer.sh -p my-profile      # Use custom AWS profile
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
        -r|--runtime)
            RUNTIME="$2"
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

# Validate stage
if [[ ! "$STAGE" =~ ^(dev|qa|uat|prod)$ ]]; then
    log_error "Invalid stage: $STAGE. Must be dev, qa, uat, or prod"
    exit 1
fi

# Export AWS profile
export AWS_PROFILE="$AWS_PROFILE"

# Paths
LAYERS_DIR="$SCRIPT_DIR/shared/layers"
BUILD_DIR="$LAYERS_DIR/build"
NODEJS_DIR="$LAYERS_DIR/nodejs"

# Display header
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Build and Publish Lambda Layer${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "Stage:  $STAGE"
echo -e "Runtime: $RUNTIME"
echo -e "Profile: $AWS_PROFILE"
echo -e "${CYAN}========================================${NC}"
echo ""

# Step 1: Install dependencies
log_info "Installing dependencies..."
cd "$NODEJS_DIR"
if npm install --silent; then
    log_success "✓ Dependencies installed"
else
    log_error "Failed to install dependencies"
    exit 1
fi
cd "$SCRIPT_DIR"

# Step 2: Clean and create build directory
log_info "Building layer..."
if [[ -d "$BUILD_DIR" ]]; then
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"

# Step 3: Copy nodejs folder to build
cp -r "$NODEJS_DIR" "$BUILD_DIR/"

# Step 4: Create zip
log_info "Creating layer zip..."
ZIP_PATH="$BUILD_DIR/layer.zip"
cd "$BUILD_DIR"
zip -r -q "layer.zip" "nodejs"
cd "$SCRIPT_DIR"
log_success "✓ Layer built"

# Step 5: Publish to AWS
log_info "Publishing to AWS Lambda..."
LAYER_NAME="onebt-shared-libs-$STAGE"

VERSION=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --zip-file "fileb://$ZIP_PATH" \
    --compatible-runtimes "$RUNTIME" \
    --region "$REGION" \
    --profile "$AWS_PROFILE" \
    --query 'Version' \
    --output text)

if [[ $? -eq 0 ]]; then
    log_success "✓ Layer published successfully"
    echo ""
    log_info "============================================"
    log_success "  Layer Version: $VERSION"
    log_info "============================================"
    echo ""
    log_info "To update all services, run:"
    echo -e "${YELLOW}  ./update-layer.sh -v $VERSION -d${NC}"
else
    log_error "Failed to publish layer"
    exit 1
fi

