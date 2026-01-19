# 1BT Resource Management System - Backend

AWS Serverless **Microservices** backend for the 1BT Resource Management System.

## Tech Stack

- **Runtime**: Node.js 20.x (APIs), Python 3.11 (Document Generation)
- **Framework**: Serverless Framework v3
- **Database**: PostgreSQL 16 (Amazon RDS)
- **Authentication**: AWS Cognito
- **API Gateway**: AWS HTTP API v2

## Architecture

The backend follows a **microservices architecture** with 6 independent services:

| Service              | Description                      | Runtime      |
| -------------------- | -------------------------------- | ------------ |
| `auth-service`       | Authentication & user management | Node.js 20.x |
| `resource-service`   | Employee/resource management     | Node.js 20.x |
| `project-service`    | Projects & clients management    | Node.js 20.x |
| `allocation-service` | Resource allocations             | Node.js 20.x |
| `report-service`     | Reporting APIs                   | Node.js 20.x |
| `document-service`   | PDF/Excel generation             | Python 3.11  |

## Project Structure

```
backend/
├── infrastructure/         # Single Serverless stack for all infra
│   └── serverless.yml      # VPC, RDS, Cognito, API Gateway
├── shared/                 # Shared Lambda Layer
│   ├── serverless.yml
│   └── layers/
├── services/               # Independent microservices
│   ├── auth-service/       # Authentication (7 endpoints)
│   ├── resource-service/   # Resources (15 endpoints)
│   ├── project-service/    # Projects & Clients (12 endpoints)
│   ├── allocation-service/ # Allocations (7 endpoints)
│   ├── report-service/     # Reports (7 endpoints)
│   └── document-service/   # Documents (5 endpoints, Python)
├── database/               # Migrations & seeds
├── tests/                  # Unit & integration tests
└── deploy.ps1              # Master deployment script
```

## Deployment

### Full Deployment (All Services)

```powershell
# Deploy everything (infrastructure → shared layer → all services)
.\deploy.ps1 -Stage dev -Action deploy

# Check deployment status
.\deploy.ps1 -Stage dev -Action status
```

### Deploy Specific Service

```powershell
# Deploy only infrastructure
.\deploy.ps1 -Stage dev -Action deploy -Service infrastructure

# Deploy only shared layer
.\deploy.ps1 -Stage dev -Action deploy -Service shared

# Deploy individual microservices
.\deploy.ps1 -Stage dev -Action deploy -Service auth
.\deploy.ps1 -Stage dev -Action deploy -Service resource
.\deploy.ps1 -Stage dev -Action deploy -Service project
.\deploy.ps1 -Stage dev -Action deploy -Service allocation
.\deploy.ps1 -Stage dev -Action deploy -Service report
.\deploy.ps1 -Stage dev -Action deploy -Service document
```

### Remove Deployment

```powershell
# Remove everything (reverse order)
.\deploy.ps1 -Stage dev -Action remove

# Remove specific service
.\deploy.ps1 -Stage dev -Action remove -Service auth
```

## Infrastructure Costs (Estimated Monthly)

| Environment | Cost  | Details                                     |
| ----------- | ----- | ------------------------------------------- |
| Dev         | ~$12  | RDS db.t3.micro, no NAT Gateway             |
| QA          | ~$12  | RDS db.t3.micro, no NAT Gateway             |
| UAT         | ~$56  | RDS db.t3.small + NAT Gateway               |
| Prod        | ~$160 | RDS Multi-AZ + NAT Multi-AZ + VPC Endpoints |

## Database Migrations

```bash
npm run migrate:up     # Run pending migrations
npm run migrate:down   # Rollback last migration
```

## Testing

```bash
npm test                  # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
```
