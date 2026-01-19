# 1BT Resource Management - Microservices Architecture

## Overview

This document describes the microservices architecture for the 1BT Resource Management Tracker application. The system has been refactored from a monolithic Serverless application into independent, loosely-coupled microservices.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway (HTTP API)                        │   │
│  │                    + Cognito JWT Authorizer                          │   │
│  └───────────────────────────────┬─────────────────────────────────────┘   │
│                                  │                                          │
│  ┌───────────────────────────────┼─────────────────────────────────────┐   │
│  │                          VPC (10.0.0.0/16)                          │   │
│  │  ┌────────────────────────────┴────────────────────────────────┐    │   │
│  │  │                    Private Subnets (Lambdas)                 │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │    │   │
│  │  │  │   Auth   │ │ Resource │ │ Project  │ │Allocation│        │    │   │
│  │  │  │ Service  │ │ Service  │ │ Service  │ │ Service  │        │    │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────┐ ┌──────────┐                                  │    │   │
│  │  │  │  Report  │ │ Document │                                  │    │   │
│  │  │  │ Service  │ │ Service  │ (Python)                         │    │   │
│  │  │  └──────────┘ └──────────┘                                  │    │   │
│  │  │                                                              │    │   │
│  │  │              All use: [Shared Lambda Layer]                  │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  │                               │                                       │   │
│  │  ┌────────────────────────────┴────────────────────────────────┐    │   │
│  │  │                   Database Subnets (Isolated)                │    │   │
│  │  │                                                              │    │   │
│  │  │                    ┌─────────────────┐                       │    │   │
│  │  │                    │  PostgreSQL RDS │                       │    │   │
│  │  │                    │    (db.t3.micro)│                       │    │   │
│  │  │                    └─────────────────┘                       │    │   │
│  │  └──────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   Cognito   │  │     S3      │  │ CloudWatch  │                         │
│  │  User Pool  │  │  Documents  │  │    Logs     │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Breakdown

### 1. Auth Service (`auth-service`)

- **Runtime**: Node.js 20.x
- **VPC**: No (Cognito is a public AWS service)
- **Endpoints**:
  - `POST /auth/login` - User login
  - `POST /auth/logout` - User logout
  - `POST /auth/refresh` - Refresh tokens
  - `POST /auth/forgot-password` - Initiate password reset
  - `POST /auth/reset-password` - Complete password reset
  - `POST /auth/invite` - Invite new user (Admin)
  - `POST /auth/complete-invite` - Complete user invitation

### 2. Resource Service (`resource-service`)

- **Runtime**: Node.js 20.x
- **VPC**: Yes (RDS access)
- **Endpoints**:
  - `GET/POST /resources` - List/Create resources
  - `GET/PUT/DELETE /resources/{id}` - CRUD operations
  - `GET /resources/{id}/allocations` - Resource allocations
  - `GET /resources/{id}/designation-history` - Designation history
  - `GET/POST /designations` - Designation management
  - `GET/PUT /designations/{id}` - Designation CRUD
  - `GET/POST /tracks` - Track management
  - `GET/PUT /tracks/{id}` - Track CRUD

### 3. Project Service (`project-service`)

- **Runtime**: Node.js 20.x
- **VPC**: Yes (RDS access)
- **Endpoints**:
  - `GET/POST /projects` - List/Create projects
  - `GET/PUT/DELETE /projects/{id}` - CRUD operations
  - `GET /projects/{id}/allocations` - Project allocations
  - `GET/POST /clients` - Client management
  - `GET/PUT/DELETE /clients/{id}` - Client CRUD
  - `GET /clients/{id}/projects` - Client projects

### 4. Allocation Service (`allocation-service`)

- **Runtime**: Node.js 20.x
- **VPC**: Yes (RDS access)
- **Endpoints**:
  - `GET/POST /allocations` - List/Create allocations
  - `GET/PUT/DELETE /allocations/{id}` - CRUD operations
  - `GET /allocations/{id}/history` - Allocation history
  - `GET /resources/{id}/utilization` - Resource utilization

### 5. Report Service (`report-service`)

- **Runtime**: Node.js 20.x
- **VPC**: Yes (RDS access)
- **Memory**: 512MB (complex queries)
- **Timeout**: 60s
- **Endpoints**:
  - `GET /dashboard` - Dashboard summary
  - `GET /reports/allocations` - Allocation report
  - `GET /reports/bench` - Bench report
  - `GET /reports/utilization` - Utilization by track
  - `GET /reports/interns` - Intern report
  - `GET /reports/account-managers` - Account manager report
  - `GET /reports/monthly-allocations` - Monthly allocation report

### 6. Document Service (`document-service`)

- **Runtime**: Python 3.11
- **VPC**: Yes (RDS access)
- **Memory**: 512MB
- **Endpoints**:
  - `POST /documents/excel/generate` - Generate custom Excel
  - `POST /documents/excel/allocations` - Allocation Excel report
  - `POST /documents/excel/bench` - Bench Excel report
  - `POST /documents/pdf/generate` - Generate PDF report
- **Scheduled**:
  - Weekly report generation (Mondays 8 AM UTC)

## Shared Infrastructure

### Shared Lambda Layer

All Node.js services share a common Lambda Layer containing:

- Database connection utilities (PostgreSQL via `pg`)
- Logger (structured JSON logging)
- Validation schemas (Joi)
- Response utilities
- Middleware (authentication, error handling)

### Infrastructure Stacks

| Stack               | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `vpc-stack`         | VPC, Subnets, NAT Gateway, Security Groups      |
| `rds-stack`         | PostgreSQL RDS instance, auto-shutdown schedule |
| `cognito-stack`     | User Pool, App Client, User Groups              |
| `api-gateway-stack` | HTTP API, Cognito Authorizer                    |

## Directory Structure

```
backend/
├── deploy.ps1                    # Master deployment script
├── infrastructure/
│   ├── vpc-stack.yml
│   ├── rds-stack.yml
│   ├── cognito-stack.yml
│   ├── api-gateway-stack.yml
│   └── parameters/
│       ├── dev.yml
│       ├── qa.yml
│       ├── uat.yml
│       └── prod.yml
├── shared/
│   ├── serverless.yml           # Lambda Layer deployment
│   ├── package.json
│   └── layers/
│       └── nodejs/
│           ├── config/
│           ├── database/
│           ├── logger/
│           ├── middleware/
│           ├── utils/
│           └── validation/
└── services/
    ├── auth-service/
    │   ├── serverless.yml
    │   ├── package.json
    │   └── src/handlers/
    ├── resource-service/
    │   ├── serverless.yml
    │   ├── package.json
    │   └── src/handlers/
    ├── project-service/
    │   ├── serverless.yml
    │   ├── package.json
    │   └── src/handlers/
    ├── allocation-service/
    │   ├── serverless.yml
    │   ├── package.json
    │   └── src/handlers/
    ├── report-service/
    │   ├── serverless.yml
    │   ├── package.json
    │   └── src/handlers/
    └── document-service/
        ├── serverless.yml
        ├── package.json
        ├── requirements.txt
        └── src/
            ├── handlers/
            └── utils/
```

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 20+
- Python 3.11+ (for document-service)
- Docker (for Python Lambda packaging)

### Full Deployment

```powershell
# Deploy all services to dev
.\deploy.ps1 -Stage dev -Action deploy

# Check deployment status
.\deploy.ps1 -Stage dev -Action status

# Deploy single service
.\deploy.ps1 -Stage dev -Action deploy -Service resource-service
```

### Deployment Order

1. **Infrastructure** (VPC → RDS → Cognito → API Gateway)
2. **Shared Layer**
3. **Microservices** (can be parallel)

### Removal

```powershell
# Remove all resources (with confirmation)
.\deploy.ps1 -Stage dev -Action remove
```

## Environment Variables

All services receive these environment variables:

- `STAGE` - Deployment stage
- `LOG_LEVEL` - Logging level
- `DB_HOST` - RDS endpoint (from CloudFormation export)
- `DB_PORT` - Database port (5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username (from SSM)
- `DB_PASSWORD` - Database password (from SSM)

## Security

### Authentication

- All endpoints (except auth) require JWT token in Authorization header
- Tokens issued by Cognito User Pool
- Token validation via API Gateway Cognito Authorizer

### Network

- Lambda functions in private subnets (no direct internet access)
- RDS in isolated subnets (no internet access)
- NAT Gateway for outbound internet (optional, for external APIs)
- Security groups restrict traffic between components

### Data

- RDS encrypted at rest (KMS)
- Connections via SSL
- S3 bucket encrypted (AES-256)
- SSM Parameters for secrets

## Monitoring

### CloudWatch

- All Lambda logs in CloudWatch Logs
- Log groups: `/aws/lambda/onebt-{service}-{stage}-{function}`
- Structured JSON logging for easy querying

### Metrics

- Lambda invocations, duration, errors
- RDS connections, CPU, storage
- API Gateway requests, latency, 4xx/5xx errors

## Cost Optimization

### Development

- RDS auto-shutdown (8 PM - 8 AM weekdays, all day weekends)
- NAT Gateway conditional (disabled in dev)
- db.t3.micro for dev/qa

### Production

- Reserved capacity for predictable workloads
- Multi-AZ RDS for high availability
- CloudWatch alarms for cost anomalies

## Migration from Monolith

This architecture was migrated from a single `serverless.yml` containing all Lambda functions. Benefits of the new architecture:

1. **Independent Deployments** - Deploy services without affecting others
2. **Technology Flexibility** - Python for document generation, Node.js for API
3. **Scalability** - Scale services independently based on load
4. **Team Autonomy** - Different teams can own different services
5. **Failure Isolation** - Issues in one service don't cascade
6. **Faster CI/CD** - Smaller packages, faster deployments
