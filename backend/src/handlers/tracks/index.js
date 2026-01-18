/**
 * Tracks Lambda Handler
 */

import { withMiddleware } from '../../middleware/index.js';
import trackService from '../../services/trackService.js';
import { trackSchemas, validate, uuid } from '../../lib/validation/index.js';
import { success, created, noContent, errors } from '../../utils/response.js';

const listTracks = async () => {
    const tracks = await trackService.list();
    return success(tracks);
};

const getTrack = async (event) => {
    const { id } = event.pathParameters;
    validate({ id }, { id: uuid.required() });

    const track = await trackService.getById(id);
    if (!track) return errors.notFound('Track');
    return success(track);
};

const createTrack = async (event) => {
    const data = validate(event.body, trackSchemas.create);
    const track = await trackService.create(data);
    return created(track);
};

const updateTrack = async (event) => {
    const { id } = event.pathParameters;
    validate({ id }, { id: uuid.required() });
    const data = validate(event.body, trackSchemas.update);

    const track = await trackService.update(id, data);
    if (!track) return errors.notFound('Track');
    return success(track);
};

const handlerFn = async (event) => {
    const { httpMethod, path } = event;

    if (httpMethod === 'GET' && !event.pathParameters?.id) {
        return listTracks();
    }
    if (httpMethod === 'GET' && event.pathParameters?.id) {
        return getTrack(event);
    }
    if (httpMethod === 'POST') {
        return createTrack(event);
    }
    if (httpMethod === 'PUT') {
        return updateTrack(event);
    }

    return errors.notFound('Endpoint');
};

export const handler = withMiddleware(handlerFn);
