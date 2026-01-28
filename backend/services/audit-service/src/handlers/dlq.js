/**
 * Dead Letter Queue Handler
 * Endpoints for monitoring and reprocessing failed audit messages
 */

import { SQSClient, ReceiveMessageCommand, SendMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import logger from '/opt/nodejs/logger/index.js';
import { success, error, notFound, badRequest } from '/opt/nodejs/utils/response.js';
import { withMiddleware } from '/opt/nodejs/middleware/index.js';

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const DLQ_URL = process.env.AUDIT_DLQ_URL;
const AUDIT_QUEUE_URL = process.env.AUDIT_QUEUE_URL;

/**
 * Get messages from Dead Letter Queue for review
 */
const getMessagesHandler = async (event) => {
    const log = logger.child({ handler: 'dlq.getMessages' });
    const params = event.queryStringParameters || {};
    const { maxMessages = 10 } = params;

    try {
        log.info('Fetching DLQ messages', { maxMessages });

        const command = new ReceiveMessageCommand({
            QueueUrl: DLQ_URL,
            MaxNumberOfMessages: Math.min(parseInt(maxMessages), 10),
            WaitTimeSeconds: 1,
            AttributeNames: ['All'],
            MessageAttributeNames: ['All']
        });

        const response = await sqs.send(command);
        const messages = response.Messages || [];

        // Parse and format messages
        const formattedMessages = messages.map(msg => {
            let body;
            try {
                body = JSON.parse(msg.Body);
            } catch {
                body = msg.Body;
            }

            return {
                messageId: msg.MessageId,
                receiptHandle: msg.ReceiptHandle,
                body,
                attributes: msg.Attributes,
                approximateReceiveCount: msg.Attributes?.ApproximateReceiveCount,
                sentTimestamp: msg.Attributes?.SentTimestamp
                    ? new Date(parseInt(msg.Attributes.SentTimestamp)).toISOString()
                    : null,
                firstReceiveTimestamp: msg.Attributes?.ApproximateFirstReceiveTimestamp
                    ? new Date(parseInt(msg.Attributes.ApproximateFirstReceiveTimestamp)).toISOString()
                    : null
            };
        });

        return success({
            queueUrl: DLQ_URL,
            messageCount: formattedMessages.length,
            messages: formattedMessages
        });

    } catch (err) {
        log.error('Failed to fetch DLQ messages', { error: err.message });
        return error('Failed to fetch DLQ messages', err);
    }
};

/**
 * Reprocess a failed message by sending it back to the main queue
 */
const reprocessHandler = async (event) => {
    const log = logger.child({ handler: 'dlq.reprocess' });
    const { messageId } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');
    const { receiptHandle, modifiedBody } = body;

    try {
        if (!receiptHandle) {
            return badRequest('receiptHandle is required in request body');
        }

        log.info('Reprocessing DLQ message', { messageId });

        // First, get the message from DLQ to verify it exists
        const receiveCommand = new ReceiveMessageCommand({
            QueueUrl: DLQ_URL,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 0,
            AttributeNames: ['All']
        });

        const receiveResponse = await sqs.send(receiveCommand);
        const targetMessage = (receiveResponse.Messages || []).find(
            msg => msg.MessageId === messageId || msg.ReceiptHandle === receiptHandle
        );

        if (!targetMessage && !modifiedBody) {
            // If we can't find the message but have the receipt handle, try to use provided body
            log.warn('Message not found in DLQ peek, using provided data');
        }

        // Determine the body to send
        const messageBody = modifiedBody
            ? JSON.stringify(modifiedBody)
            : (targetMessage?.Body || null);

        if (!messageBody) {
            return badRequest('Could not determine message body. Provide modifiedBody in request.');
        }

        // Send to main audit queue
        const sendCommand = new SendMessageCommand({
            QueueUrl: AUDIT_QUEUE_URL,
            MessageBody: messageBody,
            MessageAttributes: {
                ReprocessedFrom: {
                    DataType: 'String',
                    StringValue: 'DLQ'
                },
                OriginalMessageId: {
                    DataType: 'String',
                    StringValue: messageId
                },
                ReprocessedAt: {
                    DataType: 'String',
                    StringValue: new Date().toISOString()
                }
            }
        });

        const sendResponse = await sqs.send(sendCommand);

        // Delete from DLQ
        const deleteCommand = new DeleteMessageCommand({
            QueueUrl: DLQ_URL,
            ReceiptHandle: receiptHandle
        });

        await sqs.send(deleteCommand);

        log.info('Message reprocessed successfully', {
            originalMessageId: messageId,
            newMessageId: sendResponse.MessageId
        });

        return success({
            success: true,
            originalMessageId: messageId,
            newMessageId: sendResponse.MessageId,
            message: 'Message requeued to audit queue and removed from DLQ'
        });

    } catch (err) {
        log.error('Failed to reprocess DLQ message', { messageId, error: err.message });
        return error('Failed to reprocess message', err);
    }
};

// Export with middleware
export const getMessages = withMiddleware(getMessagesHandler, {
    requireAuth: true,
    serviceName: 'audit-service',
    parseBody: false
});

export const reprocess = withMiddleware(reprocessHandler, {
    requireAuth: true,
    serviceName: 'audit-service'
});
