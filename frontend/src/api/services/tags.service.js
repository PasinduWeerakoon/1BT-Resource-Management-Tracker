/**
 * Tags Service
 * API calls for tags management
 * Refactored to use baseService utility for reduced boilerplate
 */

import { ENDPOINTS } from '../endpoints';
import { createBaseService } from '../utils/baseService';

// Create service using baseService utility
// This automatically provides getAll, getById, create, update, delete methods
// with standardized error handling and response transformation
export const tagsService = createBaseService({
  LIST: ENDPOINTS.TAGS.LIST,
  GET_BY_ID: (id) => ENDPOINTS.TAGS.GET_BY_ID(id),
  CREATE: ENDPOINTS.TAGS.CREATE,
  UPDATE: (id) => ENDPOINTS.TAGS.UPDATE(id),
  DELETE: (id) => ENDPOINTS.TAGS.DELETE(id),
});

export default tagsService;
