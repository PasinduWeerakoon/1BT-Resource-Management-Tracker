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
└── deploy.sh               # Master deployment script
```

## Deployment

### Full Deployment (All Services)

```bash
# Deploy everything (infrastructure → shared layer → all services)
./deploy.sh -s dev -a deploy

# Check deployment status
./deploy.sh -s dev -a status
```

### Deploy Specific Service

```bash
# Deploy only infrastructure
./deploy.sh -s dev -a deploy -c infrastructure

# Deploy only shared layer
./deploy.sh -s dev -a deploy -c shared

# Deploy individual microservices
./deploy.sh -s dev -a deploy -c auth
./deploy.sh -s dev -a deploy -c resource
./deploy.sh -s dev -a deploy -c project
./deploy.sh -s dev -a deploy -c allocation
./deploy.sh -s dev -a deploy -c report
./deploy.sh -s dev -a deploy -c document
```

### Remove Deployment

```bash
# Remove everything (reverse order)
./deploy.sh -s dev -a remove

# Remove specific service
./deploy.sh -s dev -a remove -c auth
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
