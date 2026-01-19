/**
 * Database Client
 * PostgreSQL connection pool with connection management
 */

import pkg from 'pg';
const { Pool } = pkg;
import config from '../../config/index.js';
import logger from '../logger/index.js';

let pool = null;

/**
 * Get or create database connection pool
 */
const getPool = () => {
    if (!pool) {
        console.log('[DB] Creating new pool...');
        console.log('[DB] config.database.url:', config.database.url);
        console.log('[DB] config.database.host:', config.database.host);
        console.log('[DB] config.database.port:', config.database.port);
        console.log('[DB] config.database.name:', config.database.name);
        console.log('[DB] config.database.user:', config.database.user);
        console.log('[DB] config.database.password exists:', !!config.database.password);

        const connectionConfig = config.database.url
            ? { connectionString: config.database.url, ssl: config.database.ssl }
            : {
                host: config.database.host,
                port: config.database.port,
                database: config.database.name,
                user: config.database.user,
                password: config.database.password,
                ssl: config.database.ssl,
            };

        console.log('[DB] Final connectionConfig host:', connectionConfig.host);

        pool = new Pool({
            ...connectionConfig,
            min: config.database.poolMin,
            max: config.database.poolMax,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        pool.on('error', (err) => {
            console.error('[DB] Pool error:', err.message);
            logger.error('Unexpected database pool error', { error: err.message });
        });

        pool.on('connect', () => {
            console.log('[DB] New connection established');
            logger.debug('New database connection established');
        });
    }
    return pool;
};

/**
 * Execute a query with parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await getPool().query(text, params);
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
 * @returns {Promise<object>} Pool client
 */
const getClient = async () => {
    const client = await getPool().connect();
    const originalQuery = client.query.bind(client);
    const originalRelease = client.release.bind(client);

    // Override release to log
    client.release = () => {
        logger.debug('Database client released');
        return originalRelease();
    };

    // Override query to log
    client.query = async (text, params) => {
        const start = Date.now();
        try {
            const result = await originalQuery(text, params);
            logger.debug('Transaction query executed', {
                duration: Date.now() - start,
            });
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
 * @param {Function} callback - Function receiving client
 * @returns {Promise<any>} Transaction result
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
 * Close all connections (for graceful shutdown)
 */
const close = async () => {
    if (pool) {
        await pool.end();
        pool = null;
        logger.info('Database pool closed');
    }
};

export {
    query,
    getClient,
    transaction,
    close,
    getPool,
};
