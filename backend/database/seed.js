/**
 * Database Seed Data
 * Run this after migrations to populate initial data
 * 
 * Usage: npm run db:seed
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as schema from '../shared/layers/nodejs/database/schema.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'onebt_dev',
});

const db = drizzle(pool, { schema });

async function seed() {
    console.log('🌱 Starting database seed...');

    try {
        // =====================================================
        // SEED DESIGNATIONS
        // =====================================================
        console.log('Seeding designations...');
        const designationsData = [
            // Engineering - Intern
            { name: 'Intern - SE', level: 1, isInternRole: true, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 1 },
            { name: 'Intern SE - Data Analytics', level: 1, isInternRole: true, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 2 },
            { name: 'Intern Software Engineer - Data Analytics', level: 1, isInternRole: true, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 3 },
            { name: 'Intern - Data Engineer', level: 1, isInternRole: true, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 4 },
            { name: 'Intern - Analytics & Data Science', level: 1, isInternRole: true, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 5 },
            // Engineering
            { name: 'ASE', level: 2, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 6 },
            { name: 'ASE - Data Analytics', level: 2, isInternRole: false, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 7 },
            { name: 'ASE - UI', level: 2, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 8 },
            { name: 'ASE - UI Engineer', level: 2, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 9 },
            { name: 'Associate Engineer - Analytics and Data Science', level: 2, isInternRole: false, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 10 },
            { name: 'SE', level: 3, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 11 },
            { name: 'SE - UI', level: 3, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 12 },
            { name: 'Engineer - Analytics and Data Science', level: 3, isInternRole: false, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 13 },
            { name: 'SSE', level: 4, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 14 },
            { name: 'ATL', level: 5, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 15 },
            { name: 'TL', level: 6, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 16 },
            { name: 'TL - UI/UX', level: 6, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 17 },
            { name: 'Technical Lead - Analytics & Data Science', level: 6, isInternRole: false, category: 'Data Science', isActive: true, isDefault: true, displayOrder: 18 },
            { name: 'STL', level: 7, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 19 },
            { name: 'Associate Architect', level: 7, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 20 },
            { name: 'Architect', level: 8, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 21 },
            { name: 'Principal Solutions Architect', level: 9, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 22 },
            { name: 'Delivery Architect / Head of Engineering and overall GDC Lead', level: 10, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 23 },
            { name: 'External Architect', level: 8, isInternRole: false, category: 'Engineering', isActive: true, isDefault: true, displayOrder: 24 },
            // QA
            { name: 'Intern - QA', level: 1, isInternRole: true, category: 'QA', isActive: true, isDefault: true, displayOrder: 25 },
            { name: 'AQAE', level: 2, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 26 },
            { name: 'QAE', level: 3, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 27 },
            { name: 'SQAE', level: 4, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 28 },
            { name: 'AQAL', level: 5, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 29 },
            { name: 'QAL', level: 6, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 30 },
            { name: 'Senior Manager - QA', level: 8, isInternRole: false, category: 'QA', isActive: true, isDefault: true, displayOrder: 31 },
            // BA/PM
            { name: 'Intern - BA', level: 1, isInternRole: true, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 32 },
            { name: 'Intern - BA/PM', level: 1, isInternRole: true, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 33 },
            { name: 'Intern - PM', level: 1, isInternRole: true, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 34 },
            { name: 'Associate -BA/PM', level: 2, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 35 },
            { name: 'Associate - Business Analyst', level: 2, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 36 },
            { name: 'Associate - Project Management', level: 2, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 37 },
            { name: 'Associate - Business Consultant', level: 2, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 38 },
            { name: 'SBA', level: 4, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 39 },
            { name: 'Senior Business Analyst', level: 4, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 40 },
            { name: 'PM', level: 5, isInternRole: false, category: 'BA/PM', isActive: true, isDefault: true, displayOrder: 41 },
            // Dynamics
            { name: 'BA - BC Functional Consultant', level: 3, isInternRole: false, category: 'Dynamics', isActive: true, isDefault: true, displayOrder: 42 },
            { name: 'SBA - BC Functional Consultant', level: 4, isInternRole: false, category: 'Dynamics', isActive: true, isDefault: true, displayOrder: 43 },
            { name: 'Senior Manager Dynamics – F&O', level: 8, isInternRole: false, category: 'Dynamics', isActive: true, isDefault: true, displayOrder: 44 },
            { name: 'Associate Director - Dynamics F&O', level: 9, isInternRole: false, category: 'Dynamics', isActive: true, isDefault: true, displayOrder: 45 },
            // Design
            { name: 'Intern - Graphic Designer', level: 1, isInternRole: true, category: 'Design', isActive: true, isDefault: true, displayOrder: 46 },
            { name: 'Associate Designer - UI/UX', level: 2, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 47 },
            { name: 'Associate UI/UX Designer', level: 2, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 48 },
            { name: 'Associate - Graphic Designer', level: 2, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 49 },
            { name: 'UI/UX Designer', level: 3, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 50 },
            { name: 'Senior UI/UX Designer', level: 4, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 51 },
            { name: 'Senior UX Designer', level: 4, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 52 },
            { name: 'Lead – UI', level: 6, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 53 },
            { name: 'Senior Lead - UI', level: 7, isInternRole: false, category: 'Design', isActive: true, isDefault: true, displayOrder: 54 },
            // Finance
            { name: 'Accounts Assistant', level: 1, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 55 },
            { name: 'Junior Executive - Finance', level: 2, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 56 },
            { name: 'Executive-Finance', level: 3, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 57 },
            { name: 'Senior Executive-Finance', level: 4, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 58 },
            { name: 'Accountant', level: 4, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 59 },
            { name: 'Senior Accountant', level: 5, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 60 },
            { name: 'Director-Finance', level: 9, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 61 },
            { name: 'Director - Finance', level: 9, isInternRole: false, category: 'Finance', isActive: true, isDefault: true, displayOrder: 62 },
            // HR
            { name: 'Intern - HR', level: 1, isInternRole: true, category: 'HR', isActive: true, isDefault: true, displayOrder: 63 },
            { name: 'Junior Executive - HR', level: 2, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 64 },
            { name: 'Executive - HR', level: 3, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 65 },
            { name: 'Executive-HR', level: 3, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 66 },
            { name: 'Senior Executive-HR', level: 4, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 67 },
            { name: 'Manager-HR', level: 6, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 68 },
            { name: 'Senior Manager - Human Resources', level: 8, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 69 },
            { name: 'Director - People & Culture', level: 9, isInternRole: false, category: 'HR', isActive: true, isDefault: true, displayOrder: 70 },
            // Admin
            { name: 'Junior Executive -Admin/IT', level: 2, isInternRole: false, category: 'Admin', isActive: true, isDefault: true, displayOrder: 71 },
            { name: 'Associate Lead - IT & Administration', level: 5, isInternRole: false, category: 'Admin', isActive: true, isDefault: true, displayOrder: 72 },
            // Marketing/Sales
            { name: 'Intern - Sales & Marketing', level: 1, isInternRole: true, category: 'Marketing', isActive: true, isDefault: true, displayOrder: 73 },
            { name: 'Digital Marketing Executive', level: 3, isInternRole: false, category: 'Marketing', isActive: true, isDefault: true, displayOrder: 74 },
            { name: 'Senior Executive - Business Development', level: 4, isInternRole: false, category: 'Marketing', isActive: true, isDefault: true, displayOrder: 75 },
            { name: 'Senior Manager - Sales & Marketing', level: 8, isInternRole: false, category: 'Marketing', isActive: true, isDefault: true, displayOrder: 76 },
            { name: 'Associate Director – Business Development / Head of Client Services', level: 9, isInternRole: false, category: 'Marketing', isActive: true, isDefault: true, displayOrder: 77 },
            // Executive
            { name: 'Director / Head of Delivery and Resource Management', level: 10, isInternRole: false, category: 'Executive', isActive: true, isDefault: true, displayOrder: 78 },
            { name: 'Senior Vice President & COO', level: 11, isInternRole: false, category: 'Executive', isActive: true, isDefault: true, displayOrder: 79 },
            { name: 'CEO', level: 12, isInternRole: false, category: 'Executive', isActive: true, isDefault: true, displayOrder: 80 },
            // Other
            { name: 'External Consultant', level: 5, isInternRole: false, category: 'Other', isActive: true, isDefault: true, displayOrder: 81 },
            { name: 'None', level: 0, isInternRole: false, category: 'Other', isActive: true, isDefault: true, displayOrder: 82 },
        ];

        await db.insert(schema.designations).values(designationsData).onConflictDoNothing();
        console.log(`✅ Inserted ${designationsData.length} designations`);

        // =====================================================
        // SEED BILLING STATUSES
        // =====================================================
        console.log('Seeding billing statuses...');
        const billingStatusesData = [
            { name: 'Billing', description: 'Project is billable', isActive: true, isDefault: true, displayOrder: 1 },
            { name: 'Non-Billing', description: 'Project is not billable', isActive: true, isDefault: true, displayOrder: 2 },
            { name: 'Bench', description: 'Bench/Available pool', isActive: true, isDefault: true, displayOrder: 3 },
            { name: 'Training', description: 'Training activities', isActive: true, isDefault: true, displayOrder: 4 },
            { name: 'Presale', description: 'Pre-sales activities', isActive: true, isDefault: true, displayOrder: 5 },
            { name: 'Support', description: 'Support activities', isActive: true, isDefault: true, displayOrder: 6 },
            { name: 'Execs', description: 'Executive activities', isActive: true, isDefault: true, displayOrder: 7 },
        ];

        await db.insert(schema.billingStatuses).values(billingStatusesData).onConflictDoNothing();
        console.log(`✅ Inserted ${billingStatusesData.length} billing statuses`);

        // =====================================================
        // SEED PROJECT TYPES
        // =====================================================
        console.log('Seeding project types...');
        const projectTypesData = [
            { name: 'Client', description: 'External client project', isActive: true, isDefault: true, displayOrder: 1 },
            { name: 'Research', description: 'Research and development', isActive: true, isDefault: true, displayOrder: 2 },
            { name: 'Training', description: 'Training program', isActive: true, isDefault: true, displayOrder: 3 },
            { name: 'Pre-Sales', description: 'Pre-sales activities', isActive: true, isDefault: true, displayOrder: 4 },
            { name: 'Investment', description: 'Investment project', isActive: true, isDefault: true, displayOrder: 5 },
            { name: 'Preparations', description: 'Project preparation phase', isActive: true, isDefault: true, displayOrder: 6 },
        ];

        await db.insert(schema.projectTypes).values(projectTypesData).onConflictDoNothing();
        console.log(`✅ Inserted ${projectTypesData.length} project types`);

        // =====================================================
        // SEED EMPLOYEE TYPES
        // =====================================================
        console.log('Seeding employee types...');
        const employeeTypesData = [
            { name: 'Permanent', description: 'Full-time permanent employee', isActive: true, isDefault: true },
            { name: 'Contract', description: 'Contract employee', isActive: true, isDefault: false },
            { name: 'Intern', description: 'Internship employee', isActive: true, isDefault: false },
            { name: 'Consultant', description: 'External consultant', isActive: true, isDefault: false },
        ];

        await db.insert(schema.employeeTypes).values(employeeTypesData).onConflictDoNothing();
        console.log(`✅ Inserted ${employeeTypesData.length} employee types`);

        // =====================================================
        // SEED TAGS
        // =====================================================
        console.log('Seeding tags...');
        const tagsData = [
            { name: 'Synergy', description: 'Synergy program participant', isActive: true, isDefault: true },
            { name: 'GDC', description: 'Global Delivery Center', isActive: true, isDefault: true },
            { name: 'Leaders League', description: 'Leadership development program', isActive: true, isDefault: true },
            { name: 'High Performer', description: 'High performing employee', isActive: true, isDefault: false },
            { name: 'Critical Resource', description: 'Business critical resource', isActive: true, isDefault: false },
        ];

        await db.insert(schema.tags).values(tagsData).onConflictDoNothing();
        console.log(`✅ Inserted ${tagsData.length} tags`);

        // =====================================================
        // SEED UNIVERSITIES
        // =====================================================
        console.log('Seeding universities...');
        const universitiesData = [
            { name: 'University of Colombo', shortName: 'UOC', country: 'Sri Lanka', isActive: true },
            { name: 'University of Moratuwa', shortName: 'UOM', country: 'Sri Lanka', isActive: true },
            { name: 'University of Peradeniya', shortName: 'UOP', country: 'Sri Lanka', isActive: true },
            { name: 'University of Kelaniya', shortName: 'UOK', country: 'Sri Lanka', isActive: true },
            { name: 'SLIIT', shortName: 'SLIIT', country: 'Sri Lanka', isActive: true },
            { name: 'NSBM Green University', shortName: 'NSBM', country: 'Sri Lanka', isActive: true },
            { name: 'IIT Sri Lanka', shortName: 'IIT', country: 'Sri Lanka', isActive: true },
            { name: 'APIIT Sri Lanka', shortName: 'APIIT', country: 'Sri Lanka', isActive: true },
            { name: 'Other', shortName: 'Other', country: 'Other', isActive: true },
        ];

        await db.insert(schema.universities).values(universitiesData).onConflictDoNothing();
        console.log(`✅ Inserted ${universitiesData.length} universities`);

        // =====================================================
        // SEED SUPER ADMIN USER
        // =====================================================
        console.log('Seeding super admin user...');
        await db.insert(schema.users).values({
            username: 'superadmin',
            email: 'hirun.dealwis@1billiontech.com',
            passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4YjKmKCDLNIKQoiG', // Change on first login
            role: 'Super User',
            status: 'Active',
            mustChangePassword: true,
        }).onConflictDoNothing();
        console.log('✅ Inserted super admin user');

        // =====================================================
        // SEED DEFAULT PROJECTS
        // =====================================================
        console.log('Seeding default projects...');

        // Get the super admin user and lookup table IDs
        const [superAdmin] = await db.select().from(schema.users).where(({ username }) => username === 'superadmin');
        const [clientType] = await db.select().from(schema.projectTypes).where(({ name }) => name === 'Client');
        const [preSalesType] = await db.select().from(schema.projectTypes).where(({ name }) => name === 'Pre-Sales');
        const [trainingType] = await db.select().from(schema.projectTypes).where(({ name }) => name === 'Training');
        const [benchStatus] = await db.select().from(schema.billingStatuses).where(({ name }) => name === 'Bench');
        const [presaleStatus] = await db.select().from(schema.billingStatuses).where(({ name }) => name === 'Presale');
        const [nonBillingStatus] = await db.select().from(schema.billingStatuses).where(({ name }) => name === 'Non-Billing');
        const [trainingStatus] = await db.select().from(schema.billingStatuses).where(({ name }) => name === 'Training');

        if (superAdmin && clientType && benchStatus) {
            const defaultProjects = [
                {
                    id: '00000000-0000-0000-0000-000000000001',
                    projectName: 'Bench',
                    projectCode: 'BENCH',
                    projectTypeId: clientType.id,
                    accountType: 'Internal',
                    teamSize: 100,
                    billingStatusId: benchStatus.id,
                    status: 'Active',
                    description: 'Default bench allocation for unassigned employees',
                    isBenchProject: true,
                    createdBy: superAdmin.id,
                },
                {
                    id: '00000000-0000-0000-0000-000000000002',
                    projectName: 'Pre-Sales',
                    projectCode: 'PRESALES',
                    projectTypeId: preSalesType?.id || clientType.id,
                    accountType: 'Internal',
                    teamSize: 50,
                    billingStatusId: presaleStatus?.id || benchStatus.id,
                    status: 'Active',
                    description: 'Pre-sales activities including demos and proposals',
                    isBenchProject: false,
                    createdBy: superAdmin.id,
                },
                {
                    id: '00000000-0000-0000-0000-000000000003',
                    projectName: 'Leave/PTO',
                    projectCode: 'LEAVE',
                    projectTypeId: clientType.id,
                    accountType: 'Internal',
                    teamSize: 100,
                    billingStatusId: nonBillingStatus?.id || benchStatus.id,
                    status: 'Active',
                    description: 'Leave, PTO, and time-off allocations',
                    isBenchProject: false,
                    createdBy: superAdmin.id,
                },
                {
                    id: '00000000-0000-0000-0000-000000000004',
                    projectName: 'Training',
                    projectCode: 'TRAINING',
                    projectTypeId: trainingType?.id || clientType.id,
                    accountType: 'Internal',
                    teamSize: 50,
                    billingStatusId: trainingStatus?.id || benchStatus.id,
                    status: 'Active',
                    description: 'Training and skill development activities',
                    isBenchProject: false,
                    createdBy: superAdmin.id,
                },
            ];

            await db.insert(schema.projects).values(defaultProjects).onConflictDoNothing();
            console.log(`✅ Inserted ${defaultProjects.length} default projects`);
        }

        console.log('✅ Database seed completed successfully!');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seed().catch(console.error);
