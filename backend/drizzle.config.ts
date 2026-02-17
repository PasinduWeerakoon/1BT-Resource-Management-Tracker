import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export default defineConfig({
    schema: './shared/layers/nodejs/database/schema.js',
    out: './database/drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'onebt_dev',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    },
    verbose: true,
    strict: true,
});
