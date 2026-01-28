/**
 * Database Client
 * PostgreSQL connection pool - shared across microservices
 * Supports AWS Secrets Manager for credential management
 */

import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/index.js';
import logger from '../logger/index.js';

let pool = null;
let cachedCredentials = null;

/**
 * Fetch database credentials from AWS Secrets Manager
 */
const getCredentialsFromSecretsManager = async () => {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    const secretArn = config.database.secretArn;
    if (!secretArn) {
        return null;
    }

    try {
        // Dynamic import to avoid requiring AWS SDK when not needed
        const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');

        const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
        const command = new GetSecretValueCommand({ SecretId: secretArn });
        const response = await client.send(command);

        const secret = JSON.parse(response.SecretString);
        cachedCredentials = {
            user: secret.username,
            password: secret.password,
            host: secret.host || config.database.host,
            port: secret.port || config.database.port,
            database: secret.dbname || config.database.name,
        };

        logger.info('Database credentials retrieved from Secrets Manager');
        return cachedCredentials;
    } catch (error) {
        logger.error('Failed to retrieve credentials from Secrets Manager', {
            error: error.message,
            secretArn
        });
        throw error;
    }
};

/**
 * Get or create database connection pool
 */
const getPool = async () => {
    if (pool) {
        return pool;
    }

    let connectionConfig;

    if (config.database.url) {
        connectionConfig = {
            connectionString: config.database.url,
            ssl: config.database.ssl
        };
    } else if (config.database.secretArn) {
        // Use Secrets Manager credentials (secure - recommended for all environments)
        // Requires VPC Endpoint for Secrets Manager when Lambda is in VPC
        const credentials = await getCredentialsFromSecretsManager();
        connectionConfig = {
            host: credentials.host,
            port: credentials.port,
            database: credentials.database,
            user: credentials.user,
            password: credentials.password,
            ssl: config.database.ssl,
        };
    } else if (config.database.user && config.database.password) {
        // Fallback to direct credentials (for local development only)
        logger.warn('Using direct database credentials - not recommended for production');
        connectionConfig = {
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            ssl: config.database.ssl,
        };
    } else {
        throw new Error('No database credentials configured. Set DB_SECRET_ARN or DB_USER/DB_PASSWORD.');
    }

    pool = new Pool({
        ...connectionConfig,
        min: config.database.poolMin,
        max: config.database.poolMax,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
        logger.error('Unexpected database pool error', { error: err.message });
    });

    pool.on('connect', () => {
        logger.debug('New database connection established');
    });

    return pool;
};

/**
 * Execute a query with parameters
 */
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const p = await getPool();
        const result = await p.query(text, params);
        const duration = Date.now() - start;
        logger.debug('Query executed', {
            query: text.substring(0, 100),
            duration,
            rowCount: result.rowCount,
        });
        return result;
    } catch (error) {
        logger.error('Query failed', {
            query: text.substring(0, 100),
            error: error.message,
        });
        throw error;
    }
};

/**
 * Get a client for transaction support
 */
const getClient = async () => {
    const p = await getPool();
    const client = await p.connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    client.release = () => {
        logger.debug('Database client released');
        return originalRelease();
    };

    client.query = async (text, params) => {
        const start = Date.now();
        try {
            const result = await originalQuery(text, params);
            logger.debug('Transaction query executed', { duration: Date.now() - start });
            return result;
        } catch (error) {
            logger.error('Transaction query failed', { error: error.message });
            throw error;
        }
    };

    return client;
};

/**
 * Execute queries within a transaction
 */
const transaction = async (callback) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Close all connections
 */
const close = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Database pool closed');
    }
};

// Drizzle ORM exports
export { getDrizzle, withTransaction, withTransactionOptions, schema } from './drizzle.js';

export { query, getClient, transaction, close, getPool };
