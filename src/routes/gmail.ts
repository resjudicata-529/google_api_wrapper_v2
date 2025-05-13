import { FastifyPluginAsync } from 'fastify';
import { 
  ListMessagesSchema,
  GetMessageSchema,
  SendMessageSchema,
} from '../types/gmail';
import { validateScopes } from '../services/auth';
import { listMessages, getMessage, sendMessage } from '../services/gmail';
import { logger } from '../utils/logger';

const GMAIL_READ_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

export const gmailRoutes: FastifyPluginAsync = async (fastify) => {
  // List messages
  fastify.post('/gmail_list_messages', {
    schema: {
      body: ListMessagesSchema,
    },
  }, async (request, reply) => {
    try {
      const { userId, maxResults, query } = request.body;

      if (!validateScopes(userId, [GMAIL_READ_SCOPE])) {
        return reply.status(403).send({
          error: 'Missing required Gmail read scope',
        });
      }

      const messages = await listMessages(userId, maxResults, query);
      reply.send({ messages });
    } catch (error) {
      logger.error('Error listing messages:', error);
      reply.status(500).send({ error: 'Failed to list messages' });
    }
  });

  // Get message details
  fastify.post('/gmail_get_message_detail', {
    schema: {
      body: GetMessageSchema,
    },
  }, async (request, reply) => {
    try {
      const { userId, messageId } = request.body;

      if (!validateScopes(userId, [GMAIL_READ_SCOPE])) {
        return reply.status(403).send({
          error: 'Missing required Gmail read scope',
        });
      }

      const message = await getMessage(userId, messageId);
      reply.send({ message });
    } catch (error) {
      logger.error('Error getting message:', error);
      reply.status(500).send({ error: 'Failed to get message' });
    }
  });

  // Send message
  fastify.post('/gmail_send_message', {
    schema: {
      body: SendMessageSchema,
    },
  }, async (request, reply) => {
    try {
      const { userId, to, subject, body } = request.body;

      if (!validateScopes(userId, [GMAIL_SEND_SCOPE])) {
        return reply.status(403).send({
          error: 'Missing required Gmail send scope',
        });
      }

      await sendMessage(userId, to, subject, body);
      reply.send({ success: true, message: 'Email sent successfully' });
    } catch (error) {
      logger.error('Error sending message:', error);
      reply.status(500).send({ error: 'Failed to send message' });
    }
  });
}; 