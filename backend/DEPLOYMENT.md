# 1BT Resource Management - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Deployment Scripts](#deployment-scripts)
5. [Deployment Procedures](#deployment-procedures)
6. [Service Details](#service-details)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The 1BT Resource Management backend is a **serverless microservices architecture** deployed on AWS using the Serverless Framework. The system consists of:

- **1 Infrastructure Stack**: VPC, RDS, Cognito, API Gateway
- **1 Shared Lambda Layer**: Common libraries and utilities
- **8 Microservices**: Independent Lambda-based services

All services are deployed to a single AWS region (default: `ap-southeast-1`) and can be deployed to multiple stages: `dev`, `qa`, `uat`, and `prod`.

---

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.31.0+)
   ```bash
   aws --version
   ```
   Install: https://aws.amazon.com/cli/

2. **Node.js** (v20.0.0+)
   ```bash
   node --version
   ```
   Install: https://nodejs.org/

3. **Serverless Framework** (v4.31.0+)
   ```bash
   npx serverless --version
   ```
   Install: `npm install -g serverless`

4. **AWS Credentials**
   ```bash
   aws configure
   # Or use AWS_PROFILE environment variable
   export AWS_PROFILE=1bt-training
   ```

### AWS Account Setup

- Valid AWS account with appropriate permissions
- IAM user/role with permissions to:
  - Create/update CloudFormation stacks
  - Create/update Lambda functions and layers
  - Create/update API Gateway
  - Create/update RDS instances
  - Create/update VPC resources
  - Create/update Cognito user pools

### Environment Variables

The deployment scripts use the following defaults:
- **Region**: `ap-southeast-1`
- **AWS Profile**: `1bt-training` (can be overridden with `AWS_PROFILE`)

---

## Architecture

### Deployment Order

Services must be deployed in the following order due to dependencies:

```
1. infrastructure  → VPC, RDS, Cognito, API Gateway (foundation)
2. shared         → Shared Lambda Layer (common libraries)
3. auth           → Authentication Service (no VPC, uses Cognito)
4. resource       → Resource Management Service (VPC for RDS)
5. project        → Project & Client Service (VPC for RDS)
6. allocation     → Allocation Service (VPC for RDS)
7. report         → Reporting Service (VPC for RDS)
8. document       → Document Generation Service (Python, VPC for RDS)
```

**Note**: Additional services (`audit-service`, `migration-service`) exist but are not included in the main deployment scripts. They can be deployed manually if needed.

### Service Dependencies

```
infrastructure
    ├── shared (depends on: infrastructure)
    │   └── auth (depends on: infrastructure, shared)
    │   └── resource (depends on: infrastructure, shared)
    │   └── project (depends on: infrastructure, shared)
    │   └── allocation (depends on: infrastructure, shared)
    │   └── report (depends on: infrastructure, shared)
    │   └── document (depends on: infrastructure, shared)
```

---

## Deployment Scripts

### Available Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `deploy.sh` | Linux/Mac | Main deployment script with full features |
| `deploy.ps1` | Windows | PowerShell version of deploy.sh |
| `deploy-all.ps1` | Windows | Simplified script for deploying all services |
| `publish-layer.ps1` | Windows | Build and publish Lambda layer manually |
| `update-layer.ps1` | Windows | Update layer version across all services |

### Script Features

#### `deploy.sh` / `deploy.ps1`

**Features:**
- ✅ Deploy all services or specific service
- ✅ Remove all services or specific service
- ✅ Check deployment status
- ✅ Automatic dependency ordering
- ✅ Prerequisites checking
- ✅ Colored output and progress tracking
- ✅ Error handling and rollback support

**Options:**
- `-s, --stage`: Deployment stage (dev, qa, uat, prod) - **Required**
- `-a, --action`: Action to perform (deploy, remove, status) - Default: deploy
- `-c, --service`: Specific service to target (optional)
- `-r, --region`: AWS region (default: ap-southeast-1)
- `-h, --help`: Show help message

#### `deploy-all.ps1`

**Features:**
- ✅ Simple deployment of all services
- ✅ Progress tracking
- ✅ Deployment summary

**Options:**
- `-Stage`: Deployment stage (default: dev)
- `-Force`: Force deployment

---

## Deployment Procedures

### Full Deployment (All Services)

#### Linux/Mac

```bash
# Deploy all services to dev
./deploy.sh -s dev -a deploy

# Deploy all services to qa
./deploy.sh -s qa -a deploy

# Deploy all services to prod
./deploy.sh -s prod -a deploy
```

#### Windows (PowerShell)

```powershell
# Deploy all services to dev
.\deploy.ps1 -Stage dev -Action deploy

# Or use the simplified script
.\deploy-all.ps1 -Stage dev
```

#### Using npm scripts

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to qa
npm run deploy:qa

# Deploy to prod
npm run deploy:prod
```

### Deploy Specific Service

#### Linux/Mac

```bash
# Deploy only infrastructure
./deploy.sh -s dev -a deploy -c infrastructure

# Deploy only shared layer
./deploy.sh -s dev -a deploy -c shared

# Deploy only auth service
./deploy.sh -s dev -a deploy -c auth

# Deploy only resource service
./deploy.sh -s dev -a deploy -c resource
```

#### Windows

```powershell
.\deploy.ps1 -Stage dev -Action deploy -Service auth
```

#### Using npm scripts

```bash
npm run deploy:infra      # Deploy infrastructure
npm run deploy:layer      # Deploy shared layer
npm run deploy:auth       # Deploy auth service
npm run deploy:resource   # Deploy resource service
```

### Check Deployment Status

```bash
# Check all services
./deploy.sh -s dev -a status

# Check specific service
./deploy.sh -s dev -a status -c auth

# Using npm
npm run status:dev
```

### Remove Deployment

**⚠️ Warning**: Removing services will delete all resources including databases!

```bash
# Remove all services (asks for confirmation)
./deploy.sh -s dev -a remove

# Remove specific service
./deploy.sh -s dev -a remove -c auth
```

**Removal Order**: Services are removed in reverse order of deployment.

### Deploy Specific Function (Advanced)

For faster iteration during development, you can deploy individual Lambda functions:

```bash
# Navigate to service directory
cd services/resource-service

# Deploy specific function
npx serverless deploy function --function list --stage dev --region ap-southeast-1
```

---

## Service Details

### Infrastructure Service

**Path**: `infrastructure/`  
**Description**: Core AWS infrastructure components  
**Resources**:
- VPC with public/private subnets
- RDS PostgreSQL database
- AWS Cognito User Pool
- API Gateway (HTTP API v2)
- Security Groups
- SQS Queues (Audit)
- Secrets Manager (RDS credentials)

**Deployment Time**: ~5-10 minutes  
**Dependencies**: None

**Outputs**:
- `HttpApiEndpoint`: API Gateway endpoint URL
- `RdsEndpoint`: RDS database endpoint
- `CognitoUserPoolId`: Cognito User Pool ID
- `CognitoClientId`: Cognito Client ID
- `AuditQueueUrl`: SQS Queue URL

### Shared Layer

**Path**: `shared/`  
**Description**: Common libraries and utilities shared across all services  
**Contents**:
- Database connection pool (PostgreSQL)
- Drizzle ORM schema definitions
- Logger (Pino)
- Middleware (Middy)
- Validation (Joi)
- Response utilities
- Audit utilities

**Deployment Time**: ~2-3 minutes  
**Dependencies**: None (but services depend on it)

**⚠️ Important**: When updating the shared layer, you must redeploy all services that use it. CloudFormation cannot update an export that's being imported by other stacks.

**Solution**: Deploy all services together:
```bash
./deploy.sh -s dev -a deploy
```

### Auth Service

**Path**: `services/auth-service/`  
**Description**: Authentication and user management  
**Runtime**: Node.js 22.x  
**VPC**: No (uses Cognito only, faster cold starts)  
**Endpoints**:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/invite` (Admin)
- `POST /api/v1/auth/complete-invite`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/users` (Admin)

**Deployment Time**: ~2-3 minutes  
**Dependencies**: infrastructure, shared

### Resource Service

**Path**: `services/resource-service/`  
**Description**: Employee/resource management  
**Runtime**: Node.js 22.x  
**VPC**: Yes (for RDS access)  
**Endpoints**:
- `GET /api/v1/resources` - List resources
- `POST /api/v1/resources` - Create resource
- `GET /api/v1/resources/{id}` - Get resource
- `PUT /api/v1/resources/{id}` - Update resource
- `DELETE /api/v1/resources/{id}` - Delete resource
- `GET /api/v1/tracks` - List tracks
- `GET /api/v1/designations` - List designations
- `GET /api/v1/tiers` - List tiers
- `GET /api/v1/tags` - List tags
- `GET /api/v1/billing-statuses` - List billing statuses
- Plus CRUD endpoints for tracks, designations, tiers, tags, billing statuses

**Deployment Time**: ~3-4 minutes  
**Dependencies**: infrastructure, shared

### Project Service

**Path**: `services/project-service/`  
**Description**: Projects and clients management  
**Runtime**: Node.js 22.x  
**VPC**: Yes (for RDS access)  
**Endpoints**:
- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients/{id}` - Get client
- `PUT /api/v1/clients/{id}` - Update client
- `DELETE /api/v1/clients/{id}` - Delete client
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/{id}` - Get project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

**Deployment Time**: ~3-4 minutes  
**Dependencies**: infrastructure, shared

### Allocation Service

**Path**: `services/allocation-service/`  
**Description**: Resource allocations to projects  
**Runtime**: Node.js 22.x  
**VPC**: Yes (for RDS access)  
**Endpoints**:
- `GET /api/v1/allocations` - List allocations
- `POST /api/v1/allocations` - Create allocation
- `GET /api/v1/allocations/{id}` - Get allocation
- `PUT /api/v1/allocations/{id}` - Update allocation
- `DELETE /api/v1/allocations/{id}` - Delete allocation
- `GET /api/v1/allocations/resource/{resourceId}` - Get allocations for resource
- `GET /api/v1/allocations/project/{projectId}` - Get allocations for project

**Deployment Time**: ~3-4 minutes  
**Dependencies**: infrastructure, shared

### Report Service

**Path**: `services/report-service/`  
**Description**: Reporting and analytics  
**Runtime**: Node.js 22.x  
**VPC**: Yes (for RDS access)  
**Memory**: 512 MB (more memory for data processing)  
**Timeout**: 60 seconds  
**Endpoints**:
- `GET /api/v1/reports/bench` - Bench report
- `GET /api/v1/reports/capacity` - Capacity report
- `GET /api/v1/reports/allocation` - Allocation report
- `GET /api/v1/reports/account-manager` - Account manager report
- `GET /api/v1/reports/utilization` - Utilization report

**Deployment Time**: ~3-4 minutes  
**Dependencies**: infrastructure, shared

### Document Service

**Path**: `services/document-service/`  
**Description**: PDF and Excel document generation  
**Runtime**: Python 3.11  
**VPC**: Yes (for RDS access)  
**Endpoints**:
- `POST /api/v1/documents/pdf` - Generate PDF
- `POST /api/v1/documents/excel` - Generate Excel
- `GET /api/v1/documents/{id}` - Get document
- `GET /api/v1/documents` - List documents
- `POST /api/v1/documents/scheduled` - Scheduled generation

**Deployment Time**: ~4-5 minutes (includes Python dependencies)  
**Dependencies**: infrastructure, shared

---

## Troubleshooting

### Common Issues

#### 1. Shared Layer Update Error

**Error**: `Cannot update export onebt-shared-layer-dev-arn as it is in use by...`

**Cause**: CloudFormation cannot update an export that's being imported by other stacks.

**Solution**: Deploy all services together:
```bash
./deploy.sh -s dev -a deploy
```

#### 2. Missing Dependencies

**Error**: `Module not found` or `Cannot find package`

**Solution**: Install dependencies in the service directory:
```bash
cd services/resource-service
npm install
```

#### 3. AWS Credentials Not Configured

**Error**: `Unable to locate credentials`

**Solution**: Configure AWS credentials:
```bash
aws configure
# Or set AWS_PROFILE
export AWS_PROFILE=1bt-training
```

#### 4. Serverless Framework Authentication

**Error**: `You must sign in or use a license key with Serverless Framework V.4`

**Solution**: Login to Serverless Framework:
```bash
npx serverless login
```

#### 5. Port Already in Use (Local Development)

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**: Kill the process using the port or change the port in `webpack.config.js`:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

#### 6. Database Connection Issues

**Error**: `Connection timeout` or `ECONNREFUSED`

**Solution**: 
- Verify RDS endpoint is correct
- Check security group rules allow Lambda access
- Verify VPC configuration
- Check Secrets Manager credentials

#### 7. CloudFormation Stack Update Conflicts

**Error**: `Resource is in use` or `Update conflict`

**Solution**: 
- Wait for previous deployment to complete
- Check CloudFormation console for stuck stacks
- Delete and recreate if necessary (⚠️ data loss)

### Debugging

#### Enable Verbose Logging

```bash
# Add --verbose flag
npx serverless deploy --stage dev --verbose

# Or use debug mode
DEBUG=* npx serverless deploy --stage dev
```

#### Check Service Logs

```bash
# View CloudWatch logs
aws logs tail /aws/lambda/onebt-resource-service-dev-list --follow

# Or use Serverless Framework
npx serverless logs --function list --stage dev --tail
```

#### Check Stack Status

```bash
# List all stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Describe specific stack
aws cloudformation describe-stacks --stack-name onebt-infrastructure-dev
```

---

## Best Practices

### 1. Deployment Order

Always deploy services in the correct order:
1. Infrastructure first
2. Shared layer second
3. Services in dependency order

### 2. Testing Before Production

- Always test in `dev` environment first
- Use `qa` for integration testing
- Use `uat` for user acceptance testing
- Deploy to `prod` only after thorough testing

### 3. Shared Layer Updates

When updating the shared layer:
- Test changes in `dev` first
- Deploy all services together to avoid CloudFormation conflicts
- Document breaking changes

### 4. Database Migrations

Run migrations before deploying services that depend on schema changes:
```bash
npm run migrate:up
```

### 5. Environment-Specific Configuration

Use stage-specific parameter files:
- `infrastructure/parameters/dev.yml`
- `infrastructure/parameters/qa.yml`
- `infrastructure/parameters/uat.yml`
- `infrastructure/parameters/prod.yml`

### 6. Monitoring

After deployment, monitor:
- CloudWatch logs for errors
- API Gateway metrics for traffic
- Lambda metrics for performance
- RDS metrics for database health

### 7. Rollback Strategy

If deployment fails:
1. Check CloudFormation console for failed resources
2. Fix the issue in code
3. Redeploy the failed service
4. If necessary, remove and redeploy

### 8. Cost Optimization

- Use appropriate instance sizes for each environment
- Monitor unused resources
- Clean up test deployments regularly
- Use reserved capacity for production RDS

### 9. Security

- Never commit AWS credentials
- Use Secrets Manager for sensitive data
- Rotate credentials regularly
- Use least-privilege IAM policies
- Enable CloudTrail for audit logging

### 10. Documentation

- Document all deployment changes
- Update this guide when adding new services
- Keep service descriptions up to date
- Document any manual steps required

---

## Additional Resources

### AWS Console Links

- **CloudFormation**: https://console.aws.amazon.com/cloudformation
- **Lambda**: https://console.aws.amazon.com/lambda
- **API Gateway**: https://console.aws.amazon.com/apigateway
- **RDS**: https://console.aws.amazon.com/rds
- **Cognito**: https://console.aws.amazon.com/cognito
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch

### Useful Commands

```bash
# List all deployed stacks
aws cloudformation list-stacks --query "StackSummaries[?StackName | contains(@, 'onebt')]"

# Get API endpoint
aws cloudformation describe-stacks \
  --stack-name onebt-infrastructure-dev \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiEndpoint'].OutputValue" \
  --output text

# Check Lambda function status
aws lambda get-function --function-name onebt-resource-service-dev-list

# View recent CloudWatch logs
aws logs tail /aws/lambda/onebt-resource-service-dev-list --since 1h
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review CloudWatch logs
3. Check Serverless Framework documentation: https://www.serverless.com/framework/docs
4. Contact the DevOps team

---

**Last Updated**: 2024  
**Version**: 2.0.0

