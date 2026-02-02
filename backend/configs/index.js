/**
 * Configuration Exports
 * 
 * This file exports all configuration enums used throughout the application.
 * These are static values that rarely change and are validated in the application layer.
 * 
 * ARCHITECTURE:
 * - Config-based enums (this file): Tracks, Tech Stacks, Tiers
 * - Database-managed tables: Designations, Billing Statuses, Project Types
 * 
 * Use these enums for:
 * - Dropdown population in frontend
 * - Validation in backend services
 * - Type safety in code
 */

const Tracks = require('./tracks.config');
const TechStacks = require('./techStacks.config');
const Tiers = require('./tiers.config');

module.exports = {
    Tracks,
    TechStacks,
    Tiers,
};
