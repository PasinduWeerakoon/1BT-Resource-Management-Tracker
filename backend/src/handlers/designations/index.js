/**
 * Designations Lambda Handler
 */

import { withMiddleware } from '../../middleware/index.js';
import designationService from '../../services/designationService.js';
import { designationSchemas, validate, uuid } from '../../lib/validation/index.js';
import { success, created, errors } from '../../utils/response.js';

const listDesignations = async () => {
    const result = await designationService.list();
    return success(result);
};

const getDesignation = async (event) => {
    const { id } = event.pathParameters;
    validate({ id }, { id: uuid.required() });

    const result = await designationService.getById(id);
    if (!result) return errors.notFound('Designation');
    return success(result);
};

const createDesignation = async (event) => {
    const data = validate(event.body, designationSchemas.create);
    const result = await designationService.create(data);
    return created(result);
};

const updateDesignation = async (event) => {
    const { id } = event.pathParameters;
    validate({ id }, { id: uuid.required() });
    const data = validate(event.body, designationSchemas.update);

    const result = await designationService.update(id, data);
    if (!result) return errors.notFound('Designation');
    return success(result);
};

const handlerFn = async (event) => {
    const { httpMethod } = event;

    if (httpMethod === 'GET' && !event.pathParameters?.id) {
        return listDesignations();
    }
    if (httpMethod === 'GET' && event.pathParameters?.id) {
        return getDesignation(event);
    }
    if (httpMethod === 'POST') {
        return createDesignation(event);
    }
    if (httpMethod === 'PUT') {
        return updateDesignation(event);
    }

    return errors.notFound('Endpoint');
};

export const handler = withMiddleware(handlerFn);
