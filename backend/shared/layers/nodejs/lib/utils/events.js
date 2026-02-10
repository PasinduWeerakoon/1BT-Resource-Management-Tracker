
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import logger from '../logger/index.js';

const region = process.env.AWS_REGION || 'ap-southeast-1';
const client = new EventBridgeClient({ region });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || 'default';

const log = logger.child({ module: 'utils.events' });

/**
 * Emit an Application Event to EventBridge
 * @param {string} source - e.g. 'com.onebt.allocation-service'
 * @param {string} detailType - e.g. 'AllocationCreated'
 * @param {object} detail - Event payload (will be JSON stringified)
 * @returns {Promise<object|null>} Response from EventBridge or null on error
 */
export const emitEvent = async (source, detailType, detail) => {
    try {
        log.info('Emitting event', { source, detailType });

        const command = new PutEventsCommand({
            Entries: [
                {
                    Source: source,
                    DetailType: detailType,
                    Detail: JSON.stringify(detail),
                    EventBusName: EVENT_BUS_NAME,
                    Time: new Date()
                }
            ]
        });

        const response = await client.send(command);

        if (response.FailedEntryCount > 0) {
            log.error('Event emission reported failures', {
                source,
                detailType,
                failures: response.Entries.filter(e => e.ErrorCode)
            });
        } else {
            log.debug('Event emitted successfully', {
                source,
                detailType,
                eventId: response.Entries[0].EventId
            });
        }

        return response;
    } catch (error) {
        log.error('Failed to emit event', { source, detailType, error: error.message, stack: error.stack });
        // We catch error to prevent blocking the main flow, but log it as error.
        return null;
    }
};
