/**
 * Application Configuration
 * Shared across all microservices
 */

const config = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',

    // API
    apiVersion: process.env.API_VERSION || 'v1',

    // Database - supports both DB_* and DATABASE_* prefixes
    database: {
        host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || process.env.DATABASE_PORT, 10) || 5432,
        name: process.env.DB_NAME || process.env.DATABASE_NAME || 'resource_management',
        user: process.env.DB_USER || process.env.DATABASE_USER || 'admin',
        password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
        secretArn: process.env.DB_SECRET_ARN,
        url: process.env.DATABASE_URL,
        ssl: (process.env.DB_HOST || process.env.DATABASE_HOST) ? { rejectUnauthorized: false } : false,
        poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    },

    // AWS Cognito
    cognito: {
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        clientId: process.env.COGNITO_CLIENT_ID,
        region: process.env.COGNITO_REGION || process.env.AWS_REGION || 'ap-southeast-1',
    },

    // AWS S3
    s3: {
        documentsBucket: process.env.S3_BUCKET_DOCUMENTS,
        frontendBucket: process.env.S3_BUCKET_FRONTEND,
        region: process.env.AWS_REGION || 'ap-southeast-1',
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};

export default config;
