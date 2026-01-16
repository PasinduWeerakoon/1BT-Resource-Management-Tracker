# =====================================================
# 1BT Resource Management - Infrastructure Deployment Script (Windows)
# =====================================================
# Usage: .\deploy-infra.ps1 -Environment dev [-EnableNAT] [-EnableMultiAZNAT]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "qa", "uat", "prod")]
    [string]$Environment,
    
    [switch]$EnableNAT,
    [switch]$EnableMultiAZNAT,
    
    [string]$Region = "ap-southeast-1"
)

$ErrorActionPreference = "Stop"

# If MultiAZ is enabled, NAT must be enabled
if ($EnableMultiAZNAT) {
    $EnableNAT = $true
}

# =====================================================
# Cost Warning
# =====================================================
Write-Host "`n=================================================" -ForegroundColor Yellow
Write-Host "Cost Estimate for $Environment Environment" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

if ($EnableNAT) {
    if ($EnableMultiAZNAT) {
        Write-Host "NAT Gateway (Multi-AZ): ~`$64/month + data transfer" -ForegroundColor Yellow
    } else {
        Write-Host "NAT Gateway (Single): ~`$32/month + data transfer" -ForegroundColor Yellow
    }
} else {
    Write-Host "NAT Gateway: Disabled (`$0)" -ForegroundColor Green
    Write-Host "Note: Lambda functions won't have internet access" -ForegroundColor Yellow
}

switch ($Environment) {
    { $_ -in "dev", "qa" } { Write-Host "RDS (db.t3.micro): ~`$12/month" }
    "uat" { Write-Host "RDS (db.t3.small): ~`$24/month" }
    "prod" { Write-Host "RDS (db.t3.medium Multi-AZ): ~`$96/month" }
}

$confirm = Read-Host "`nContinue with deployment? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Deployment cancelled."
    exit 0
}

# =====================================================
# Step 1: Deploy VPC Stack
# =====================================================
Write-Host "`nStep 1/3: Deploying VPC Stack..." -ForegroundColor Green

$enableNATValue = if ($EnableNAT) { "true" } else { "false" }
$enableMultiAZValue = if ($EnableMultiAZNAT) { "true" } else { "false" }

aws cloudformation deploy `
    --template-file infrastructure/vpc-stack.yml `
    --stack-name "1bt-vpc-$Environment" `
    --parameter-overrides `
        "Environment=$Environment" `
        "EnableNATGateway=$enableNATValue" `
        "EnableMultiAZNAT=$enableMultiAZValue" `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --tags "Project=1BT-Resource-Management" "Environment=$Environment"

if ($LASTEXITCODE -ne 0) {
    Write-Host "VPC Stack deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "VPC Stack deployed successfully!" -ForegroundColor Green

# =====================================================
# Step 2: Create SSM Parameters
# =====================================================
Write-Host "`nStep 2/3: Creating SSM Parameters..." -ForegroundColor Green

# Check if DB password exists
$dbPasswordExists = aws ssm get-parameter --name "/1bt/$Environment/db-password" --region $Region 2>$null
if (-not $dbPasswordExists) {
    # Generate random password
    $dbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
    
    aws ssm put-parameter `
        --name "/1bt/$Environment/db-password" `
        --type SecureString `
        --value $dbPassword `
        --region $Region `
        --tags "Key=Environment,Value=$Environment" "Key=Project,Value=1BT-Resource-Management"
    
    Write-Host "Created DB password in SSM: /1bt/$Environment/db-password"
} else {
    Write-Host "DB password already exists in SSM"
    $dbPassword = aws ssm get-parameter --name "/1bt/$Environment/db-password" --with-decryption --query 'Parameter.Value' --output text --region $Region
}

# Check if encryption key exists
$encKeyExists = aws ssm get-parameter --name "/1bt/$Environment/encryption-key" --region $Region 2>$null
if (-not $encKeyExists) {
    $encryptionKey = -join ((48..57) + (65..70) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    
    aws ssm put-parameter `
        --name "/1bt/$Environment/encryption-key" `
        --type SecureString `
        --value $encryptionKey `
        --region $Region `
        --tags "Key=Environment,Value=$Environment" "Key=Project,Value=1BT-Resource-Management"
    
    Write-Host "Created encryption key in SSM: /1bt/$Environment/encryption-key"
} else {
    Write-Host "Encryption key already exists in SSM"
}

# =====================================================
# Step 3: Deploy RDS Stack
# =====================================================
Write-Host "`nStep 3/3: Deploying RDS Stack..." -ForegroundColor Green

aws cloudformation deploy `
    --template-file infrastructure/rds-stack.yml `
    --stack-name "1bt-rds-$Environment" `
    --parameter-overrides `
        "Environment=$Environment" `
        "DBMasterUsername=dbadmin" `
        "DBMasterPassword=$dbPassword" `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --tags "Project=1BT-Resource-Management" "Environment=$Environment"

if ($LASTEXITCODE -ne 0) {
    Write-Host "RDS Stack deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "RDS Stack deployed successfully!" -ForegroundColor Green

# =====================================================
# Summary
# =====================================================
Write-Host "`n=================================================" -ForegroundColor Green
Write-Host "Infrastructure Deployment Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

Write-Host "`nVPC Outputs:"
aws cloudformation describe-stacks --stack-name "1bt-vpc-$Environment" --query 'Stacks[0].Outputs' --output table --region $Region

Write-Host "`nRDS Outputs:"
aws cloudformation describe-stacks --stack-name "1bt-rds-$Environment" --query 'Stacks[0].Outputs' --output table --region $Region

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for RDS to be available (~10-15 minutes)"
Write-Host "2. Run database migrations: npm run migrate:up"
Write-Host "3. Deploy Serverless application: npm run deploy:$Environment"
