/**
 * Application Configuration
 * Loads environment variables with defaults
 */

const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // API
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    name: process.env.DATABASE_NAME || 'resource_management',
    user: process.env.DATABASE_USER || 'admin',
    password: process.env.DATABASE_PASSWORD || '',
    url: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },
  
  // AWS Cognito
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    clientId: process.env.COGNITO_CLIENT_ID,
    region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-south-1',
  },
  
  // AWS S3
  s3: {
    documentsBucket: process.env.S3_BUCKET_DOCUMENTS,
    frontendBucket: process.env.S3_BUCKET_FRONTEND,
    region: process.env.AWS_REGION || 'ap-south-1',
  },
  
  // Redis (ElastiCache)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  
  // Encryption
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
