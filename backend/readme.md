# 1BT Resource Management System - Backend

AWS Serverless backend for the 1BT Resource Management System.

## Tech Stack

- **Runtime**: Node.js 20.x (APIs), Python 3.12 (Document Generation)
- **Framework**: AWS SAM (Serverless Application Model)
- **Database**: PostgreSQL 15.x (Amazon RDS)
- **Caching**: Redis (Amazon ElastiCache)

## Project Structure

```
backend/
├── src/                    # Node.js Lambda handlers & business logic
│   ├── handlers/           # Lambda entry points
│   ├── services/           # Business logic layer
│   ├── models/             # Data models
│   ├── lib/                # Shared libraries (DB, validation, logging)
│   ├── middleware/         # Middy middleware
│   └── utils/              # Helper utilities
├── python_src/             # Python Lambda functions
├── database/               # Migrations & seeds
├── infrastructure/         # SAM templates
├── layers/                 # Lambda layers
└── tests/                  # Unit & integration tests
```

## Setup

```bash
# Install dependencies
npm install

# Run database migrations
npm run migrate:up

# Start local API (requires SAM CLI)
npm run local
```

## Deployment

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID |
| `COGNITO_CLIENT_ID` | AWS Cognito App Client ID |
| `S3_BUCKET_DOCUMENTS` | S3 bucket for generated documents |

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
```
