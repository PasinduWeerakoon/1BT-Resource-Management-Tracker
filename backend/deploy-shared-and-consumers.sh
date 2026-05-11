#!/usr/bin/env bash
# Compatible with macOS system Bash 3.2.
#
# Deploys the shared Lambda layer and then redeploys every service that
# consumes it, so that all functions pick up the latest layer version.
#
# Layer ARN is published by the shared stack to SSM at:
#   /onebt/shared/layer-arn/<stage>
# and consumer services resolve it via ${ssm:...} at deploy time
# (no CFN ImportValue, no "export in use" failures).
#
# Usage:
#   ./deploy-shared-and-consumers.sh -s prod -p onehr
#   ./deploy-shared-and-consumers.sh -s dev  -p 1bt-training
#   ./deploy-shared-and-consumers.sh -s prod -p onehr --skip-shared        # only redeploy consumers
#   ./deploy-shared-and-consumers.sh -s prod -p onehr --only "auth report" # subset of consumers
#
# Options:
#   -s, --stage      dev | qa | uat | prod        (required)
#   -p, --profile    AWS profile                  (default: $AWS_PROFILE or 1bt-training)
#   -r, --region     AWS region                   (default: ap-southeast-1)
#       --skip-shared        Do not redeploy the shared layer, only redeploy consumers.
#       --only "<list>"     Space-separated subset of consumer service keys.
#       --bootstrap-ssm     Read current latest layer version and write it to SSM
#                           (use this once before the first SSM-based consumer deploy
#                            if SSM does not yet have the parameter).
#   -h, --help

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STAGE=""
AWS_PROFILE_ARG="${AWS_PROFILE:-1bt-training}"
REGION="ap-southeast-1"
SKIP_SHARED=false
BOOTSTRAP_SSM=false
ONLY_LIST=""

# Order matters only if any consumer depends on another; here they are independent.
CONSUMER_SERVICES=(auth resource configuration project allocation report)

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; MAGENTA='\033[0;35m'; NC='\033[0m'
log_info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()    { echo -e "\n${MAGENTA}=== $1 ===${NC}"; }

show_help() { sed -n '2,30p' "$0"; exit 0; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--stage)        STAGE="$2"; shift 2 ;;
        -p|--profile)      AWS_PROFILE_ARG="$2"; shift 2 ;;
        -r|--region)       REGION="$2"; shift 2 ;;
        --skip-shared)     SKIP_SHARED=true; shift ;;
        --bootstrap-ssm)   BOOTSTRAP_SSM=true; shift ;;
        --only)            ONLY_LIST="$2"; shift 2 ;;
        -h|--help)         show_help ;;
        *) log_error "Unknown option: $1"; show_help ;;
    esac
done

[[ -z "$STAGE" ]] && { log_error "Stage is required (-s)"; exit 1; }
[[ ! "$STAGE" =~ ^(dev|qa|uat|prod)$ ]] && { log_error "Invalid stage: $STAGE"; exit 1; }

export AWS_PROFILE="$AWS_PROFILE_ARG"

echo ""
echo "========================================"
echo "  1BT Shared Layer + Consumers Deploy"
echo "========================================"
echo "Stage:   $STAGE"
echo "Region:  $REGION"
echo "Profile: $AWS_PROFILE"
echo "Skip shared: $SKIP_SHARED"
echo "Bootstrap SSM: $BOOTSTRAP_SSM"
[[ -n "$ONLY_LIST" ]] && echo "Only: $ONLY_LIST"
echo ""

# Optional one-shot SSM bootstrap so consumers can resolve before we (re)deploy
# the shared stack on the new SSM-based template.
bootstrap_ssm() {
    log_step "Bootstrapping SSM /onebt/shared/layer-arn/$STAGE"
    local layer_name="onebt-shared-libs-$STAGE"
    local arn
    arn=$(aws lambda list-layer-versions \
            --layer-name "$layer_name" \
            --region "$REGION" \
            --profile "$AWS_PROFILE" \
            --query 'LayerVersions[0].LayerVersionArn' \
            --output text 2>/dev/null || echo "")
    if [[ -z "$arn" || "$arn" == "None" ]]; then
        log_error "No existing layer versions for $layer_name. Deploy shared first without --bootstrap-ssm."
        exit 1
    fi
    log_info "Latest layer ARN: $arn"
    aws ssm put-parameter \
        --name "/onebt/shared/layer-arn/$STAGE" \
        --type String \
        --value "$arn" \
        --overwrite \
        --region "$REGION" \
        --profile "$AWS_PROFILE" >/dev/null
    log_success "SSM parameter written."
}

deploy_one() {
    local key=$1
    local path=$2
    local desc=$3
    log_step "Deploying $key ($desc)"
    if [[ "$key" == "shared" ]]; then
        log_info "Installing layer dependencies in shared/layers/nodejs..."
        (cd "$SCRIPT_DIR/shared/layers/nodejs" && npm install --omit=dev --no-audit --no-fund)
    fi
    (cd "$SCRIPT_DIR/$path" && \
        npx serverless deploy \
            --stage "$STAGE" \
            --region "$REGION" \
            --aws-profile "$AWS_PROFILE")
    log_success "$key deployed."
}

consumer_path_for() {
    case "$1" in
        auth)           echo "services/auth-service" ;;
        resource)       echo "services/resource-service" ;;
        configuration)  echo "services/configuration-service" ;;
        project)        echo "services/project-service" ;;
        allocation)     echo "services/allocation-service" ;;
        report)         echo "services/report-service" ;;
        *)              echo "" ;;
    esac
}

selected_services() {
    if [[ -n "$ONLY_LIST" ]]; then
        echo "$ONLY_LIST"
    else
        echo "${CONSUMER_SERVICES[@]}"
    fi
}

if [[ "$BOOTSTRAP_SSM" == "true" ]]; then
    bootstrap_ssm
fi

if [[ "$SKIP_SHARED" != "true" ]]; then
    deploy_one shared shared "Shared Lambda Layer"
fi

# Confirm SSM has a value before we redeploy consumers.
ssm_val=$(aws ssm get-parameter \
            --name "/onebt/shared/layer-arn/$STAGE" \
            --region "$REGION" \
            --profile "$AWS_PROFILE" \
            --query 'Parameter.Value' \
            --output text 2>/dev/null || echo "")
if [[ -z "$ssm_val" || "$ssm_val" == "None" ]]; then
    log_error "SSM /onebt/shared/layer-arn/$STAGE is not set. Re-run with --bootstrap-ssm or deploy shared."
    exit 1
fi
log_info "Resolved layer ARN: $ssm_val"

FAILED=()
for svc in $(selected_services); do
    path=$(consumer_path_for "$svc")
    if [[ -z "$path" ]]; then
        log_warn "Unknown consumer service: $svc (skipping)"
        continue
    fi
    if ! deploy_one "$svc" "$path" "consumer of shared layer"; then
        FAILED+=("$svc")
    fi
done

echo ""
if [[ ${#FAILED[@]} -eq 0 ]]; then
    log_success "All consumer services redeployed against latest shared layer."
else
    log_error "Failed services: ${FAILED[*]}"
    exit 1
fi
