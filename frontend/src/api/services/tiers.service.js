/**
 * Tiers Service
 * API calls for tiers management
 * Refactored to use baseService utility for reduced boilerplate
 */

import { ENDPOINTS } from '../endpoints';
import { createBaseService } from '../utils/baseService';

// Create service using baseService utility
// This automatically provides getAll, getById, create, update, delete methods
const tiersService = createBaseService({
  LIST: ENDPOINTS.TIERS.LIST,
  GET_BY_ID: (id) => ENDPOINTS.TIERS.GET_BY_ID(id),
  CREATE: ENDPOINTS.TIERS.CREATE,
  UPDATE: (id) => ENDPOINTS.TIERS.UPDATE(id),
  DELETE: (id) => ENDPOINTS.TIERS.DELETE(id),
});

export default tiersService;
