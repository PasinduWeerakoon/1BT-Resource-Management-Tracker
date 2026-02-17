/**
 * API Module
 * Central export for all API services and utilities
 * 
 * @example
 * // Import services
 * import { authService, resourcesService, projectsService } from '@api';
 * 
 * // Login
 * const login = async (email, password) => {
 *   try {
 *     const response = await authService.login(email, password);
 *     // response.data contains { accessToken, refreshToken, idToken, expiresIn }
 *     return response.data;
 *   } catch (error) {
 *     console.error('Login failed:', error.message);
 *   }
 * };
 * 
 * // Get resources with pagination
 * const getResources = async (page = 1, limit = 20) => {
 *   try {
 *     const response = await resourcesService.getAll({ page, limit });
 *     // response.data contains { items, total, page, limit, totalPages }
 *     return response.data;
 *   } catch (error) {
 *     console.error('Failed to fetch resources:', error.message);
 *   }
 * };
 * 
 * // Create resource
 * const createResource = async (resourceData) => {
 *   try {
 *     const response = await resourcesService.create({
 *       name: 'John Doe',
 *       email: 'john@example.com',
 *       designation_id: 'uuid',
 *       track_id: 'uuid',
 *       join_date: '2024-01-01',
 *       status: 'ACTIVE',
 *     });
 *     return response.data;
 *   } catch (error) {
 *     console.error('Failed to create resource:', error.message);
 *   }
 * };
 */

// Configuration
export { API_CONFIG } from './config';
export { default as apiConfig } from './config';

// Endpoints
export { ENDPOINTS } from './endpoints';
export { default as endpoints } from './endpoints';

// API Client
export { default as apiClient } from './client';

// Services
export { default as authService } from './services/auth.service';
export { default as resourcesService } from './services/resources.service';
export { default as tracksService } from './services/tracks.service';
export { default as tagsService } from './services/tags.service';
export { default as designationsService } from './services/designations.service';
export { default as clientsService } from './services/clients.service';
export { default as projectsService } from './services/projects.service';
export { default as allocationsService } from './services/allocations.service';
export { default as futureAllocationsService } from './services/futureAllocations.service';
export { default as allocationHistoryService } from './services/allocationHistory.service';
export { default as reportsService } from './services/reports.service';
export { default as auditLogsService } from './services/auditLogs.service';
export { default as accountManagersService } from './services/accountManagers.service';
export { default as billingStatusesService } from './services/billingStatuses.service';
export { default as projectTypesService } from './services/projectTypes.service';
export { default as accountTypesService } from './services/accountTypes.service';
export { default as projectStatusesService } from './services/projectStatuses.service';
export { default as tiersService } from './services/tiers.service';
export { default as configsService } from './services/configs.service';
export { default as summaryService } from './services/summary.service';
export { default as documentsService } from './services/documents.service';

// Utilities
export * from './utils';
export { default as apiUtils } from './utils';

// Request Helpers and Base Service
export * from './utils/requestHelpers';
export * from './utils/baseService';
export { default as requestHelpers } from './utils/requestHelpers';
export { default as baseService } from './utils/baseService';

// Legacy exports for backward compatibility
export { default as employeesService } from './services/resources.service';
