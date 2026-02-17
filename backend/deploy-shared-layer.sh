#!/bin/bash

# Deploys shared Lambda layer and updates all services to use the new version
# Usage: ./deploy-shared-layer.sh [stage] [--services-only] [--skip-service-deploy]

set -e

# Default values
STAGE="${1:-dev}"
SERVICES_ONLY=false
SKIP_SERVICE_DEPLOY=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --services-only)
            SERVICES_ONLY=true
            shift
            ;;
        --skip-service-deploy)
            SKIP_SERVICE_DEPLOY=true
            shift
            ;;
        dev|qa|uat|prod)
            STAGE=$arg
            shift
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_LAYER_DIR="$SCRIPT_DIR/shared"
SERVICES_DIR="$SCRIPT_DIR/services"

# AWS Configuration
REGION="ap-southeast-1"
ACCOUNT_ID="550586832874"
LAYER_NAME="onebt-shared-libs-$STAGE"

# List of services to update
SERVICES=(
    "migration-service"
    "resource-service"
    "allocation-service"
    "report-service"
    "project-service"
    "auth-service"
    "audit-service"
    "configuration-service"
)

# Color output functions
print_color() {
    local color=$1
    local message=$2
    case $color in
        red) echo -e "\033[0;31m$message\033[0m" ;;
        green) echo -e "\033[0;32m$message\033[0m" ;;
        yellow) echo -e "\033[0;33m$message\033[0m" ;;
        cyan) echo -e "\033[0;36m$message\033[0m" ;;
        magenta) echo -e "\033[0;35m$message\033[0m" ;;
        gray) echo -e "\033[0;37m$message\033[0m" ;;
        *) echo "$message" ;;
    esac
}

get_latest_layer_version() {
    local layer_name=$1
    print_color cyan "🔍 Retrieving latest layer version for $layer_name..."
    
    local version=$(aws lambda list-layer-versions \
        --layer-name "$layer_name" \
        --region "$REGION" \
        --query 'LayerVersions[0].Version' \
        --output text)
    
    echo "$version"
}

update_service_layer_version() {
    local service_path=$1
    local layer_version=$2
    local service_name=$3
    local serverless_yml="$service_path/serverless.yml"
    
    if [ ! -f "$serverless_yml" ]; then
        print_color yellow "⚠️  Serverless.yml not found in $service_name, skipping..."
        return 1
    fi
    
    # Pattern to match the layer ARN with version
    local pattern="arn:aws:lambda:\\\${self:provider.region}:${ACCOUNT_ID}:layer:onebt-shared-libs-\\\${self:provider.stage}:[0-9]+"
    local replacement="arn:aws:lambda:\\\${self:provider.region}:${ACCOUNT_ID}:layer:onebt-shared-libs-\\\${self:provider.stage}:${layer_version}"
    
    if grep -q "$pattern" "$serverless_yml"; then
        sed -i.bak "s|$pattern|$replacement|g" "$serverless_yml"
        rm -f "${serverless_yml}.bak"
        print_color green "  ✓ Updated $service_name to layer version $layer_version"
        return 0
    else
        print_color yellow "  ⚠️  No layer reference found in $service_name"
        return 1
    fi
}

deploy_service() {
    local service_path=$1
    local service_name=$2
    
    print_color cyan "📦 Deploying $service_name..."
    cd "$service_path"
    
    local output=$(npx serverless deploy --stage "$STAGE" 2>&1)
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        local deploy_time=$(echo "$output" | grep -oP 'Service deployed to stack.*\(\K\d+(?=s\))')
        print_color green "  ✓ $service_name deployed successfully (${deploy_time}s)"
        cd - > /dev/null
        return 0
    else
        print_color red "  ✗ Failed to deploy $service_name"
        echo "$output"
        cd - > /dev/null
        return 1
    fi
}

# Main execution
print_color magenta "\n🚀 Starting shared layer deployment process for stage: $STAGE\n"

NEW_LAYER_VERSION=""

# Step 1: Deploy shared layer (unless --services-only flag is set)
if [ "$SERVICES_ONLY" = false ]; then
    print_color gray "═══════════════════════════════════════════════════════"
    print_color yellow "STEP 1: Deploying Shared Lambda Layer"
    print_color gray "═══════════════════════════════════════════════════════\n"
    
    cd "$SHARED_LAYER_DIR"
    print_color cyan "📦 Deploying shared layer..."
    
    if npx serverless deploy --stage "$STAGE"; then
        print_color green "✓ Shared layer deployed successfully\n"
        
        # Get the new layer version
        NEW_LAYER_VERSION=$(get_latest_layer_version "$LAYER_NAME")
        print_color green "✓ New layer version: $NEW_LAYER_VERSION\n"
    else
        print_color red "✗ Failed to deploy shared layer"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
else
    # If --services-only, just get the current layer version
    NEW_LAYER_VERSION=$(get_latest_layer_version "$LAYER_NAME")
    print_color cyan "Using existing layer version: $NEW_LAYER_VERSION\n"
fi

# Step 2: Update all service configurations (unless --skip-service-deploy flag is set)
if [ "$SKIP_SERVICE_DEPLOY" = false ]; then
    print_color gray "═══════════════════════════════════════════════════════"
    print_color yellow "STEP 2: Updating Service Configurations"
    print_color gray "═══════════════════════════════════════════════════════\n"
    
    UPDATED_SERVICES=()
    
    for service in "${SERVICES[@]}"; do
        service_path="$SERVICES_DIR/$service"
        if update_service_layer_version "$service_path" "$NEW_LAYER_VERSION" "$service"; then
            UPDATED_SERVICES+=("$service")
        fi
    done
    
    print_color green "\n✓ Updated ${#UPDATED_SERVICES[@]} service(s)\n"
    
    # Step 3: Deploy all updated services
    print_color gray "═══════════════════════════════════════════════════════"
    print_color yellow "STEP 3: Deploying Services"
    print_color gray "═══════════════════════════════════════════════════════\n"
    
    SUCCESS_COUNT=0
    FAIL_COUNT=0
    
    for service in "${UPDATED_SERVICES[@]}"; do
        service_path="$SERVICES_DIR/$service"
        if deploy_service "$service_path" "$service"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
        fi
    done
    
    # Summary
    print_color gray "\n═══════════════════════════════════════════════════════"
    print_color yellow "DEPLOYMENT SUMMARY"
    print_color gray "═══════════════════════════════════════════════════════"
    echo "Stage: $STAGE"
    echo "Layer Version: $NEW_LAYER_VERSION"
    echo "Services Updated: ${#UPDATED_SERVICES[@]}"
    print_color green "Successful Deployments: $SUCCESS_COUNT"
    if [ $FAIL_COUNT -gt 0 ]; then
        print_color red "Failed Deployments: $FAIL_COUNT"
    fi
    print_color gray "═══════════════════════════════════════════════════════\n"
    
    if [ $FAIL_COUNT -gt 0 ]; then
        print_color yellow "⚠️  Some deployments failed. Please check the logs above."
        exit 1
    else
        print_color green "🎉 All services deployed successfully!"
    fi
else
    print_color yellow "✓ Skipping service deployment (--skip-service-deploy flag set)\n"
    print_color green "Layer version $NEW_LAYER_VERSION is ready to use."
fi
