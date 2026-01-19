# 1BT Resource Management System - Backend

AWS Serverless **Microservices** backend for the 1BT Resource Management System.

## Tech Stack

- **Runtime**: Node.js 20.x (APIs), Python 3.11 (Document Generation)
- **Framework**: Serverless Framework v3
- **Database**: PostgreSQL 15.x (Amazon RDS)
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
├── services/               # Independent microservices
│   ├── auth-service/       # Authentication (7 endpoints)
│   ├── resource-service/   # Resources (15 endpoints)
│   ├── project-service/    # Projects & Clients (12 endpoints)
│   ├── allocation-service/ # Allocations (7 endpoints)
│   ├── report-service/     # Reports (7 endpoints)
│   └── document-service/   # Documents (5 endpoints)
├── shared/                 # Shared code & Lambda Layer
│   └── layers/common-layer/
├── infrastructure/         # CloudFormation stacks
│   ├── api-gateway-stack.yml
│   ├── cognito-stack.yml
│   ├── vpc-stack.yml
│   └── rds-stack.yml
├── database/               # Migrations & seeds
├── tests/                  # Unit & integration tests
└── deploy.ps1              # Master deployment script
```

## Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate:up
```

## Deployment

```powershell
# Deploy everything (infrastructure + all services)
.\deploy.ps1 -Stage dev -Action deploy

# Deploy specific service
npm run deploy:auth
npm run deploy:resource
npm run deploy:project
npm run deploy:allocation
npm run deploy:report
npm run deploy:document

# Remove all stacks
.\deploy.ps1 -Stage dev -Action remove
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable       | Description                  |
| -------------- | ---------------------------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `DB_HOST`      | RDS endpoint                 |
| `DB_NAME`      | Database name                |
| `DB_USER`      | Database username            |
| `DB_PASSWORD`  | Database password            |

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
```

## Documentation

See [MICROSERVICES_ARCHITECTURE.md](./MICROSERVICES_ARCHITECTURE.md) for detailed architecture documentation.
