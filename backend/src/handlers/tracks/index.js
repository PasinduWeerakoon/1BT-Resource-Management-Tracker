/**
 * Tracks Lambda Handler
 */

import { withMiddleware } from '../../middleware/index.js';
import trackService from '../../services/trackService.js';
import { trackSchemas, validate, uuid } from '../../lib/validation/index.js';
import { success, created, noContent, errors } from '../../utils/response.js';

const listTracks = async () => {
    console.log('=== listTracks START ===');
    console.log('DATABASE_HOST:', process.env.DATABASE_HOST);
    console.log('DATABASE_NAME:', process.env.DATABASE_NAME);
    console.log('DATABASE_USER:', process.env.DATABASE_USER);
    console.log('DATABASE_PORT:', process.env.DATABASE_PORT);
    console.log('DATABASE_PASSWORD exists:', !!process.env.DATABASE_PASSWORD);

    try {
        console.log('Calling trackService.list()...');
        const tracks = await trackService.list();
        console.log('trackService.list() SUCCESS, count:', tracks?.length);
        return success(tracks);
    } catch (err) {
        console.error('trackService.list() ERROR:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Error code:', err.code);
        throw err;
    }
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
