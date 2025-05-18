import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getGmailClient, convertGmailMessage } from '../services/gmail';
import { logger } from '../utils/logger';

const ListMessagesSchema = z.object({
  userId: z.string(),
  maxResults: z.string().optional(),
  query: z.string().optional(),
});

const GetMessageSchema = z.object({
  userId: z.string(),
  messageId: z.string(),
});

const SendEmailSchema = z.object({
  userId: z.string(),
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

export const gmailRoutes: FastifyPluginAsync = async (fastify) => {
  // List messages
  fastify.get('/gmail/messages', {
    schema: {
      querystring: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          maxResults: { type: 'string' },
          query: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  threadId: { type: 'string' },
                  snippet: { type: 'string' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, maxResults, query } = request.query as z.infer<typeof ListMessagesSchema>;
      
      const gmail = await getGmailClient(userId);
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults ? parseInt(maxResults) : 10,
        q: query,
      });

      const messages = response.data.messages?.map(convertGmailMessage) || [];
      reply.send({ messages });
    } catch (error: any) {
      logger.error('Error listing messages:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else if (error.response?.status === 404) {
        reply.status(404).send({ error: 'Resource not found' });
      } else {
        reply.status(500).send({ error: 'Failed to list messages' });
      }
    }
  });

  // Get specific message
  fastify.get('/gmail/message/:messageId', {
    schema: {
      params: {
        type: 'object',
        required: ['messageId'],
        properties: {
          messageId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            threadId: { type: 'string' },
            snippet: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { messageId } = request.params as { messageId: string };
      const { userId } = request.query as { userId: string };
      
      const gmail = await getGmailClient(userId);
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      if (!response.data) {
        reply.status(404).send({ error: 'Message not found' });
        return;
      }

      reply.send(convertGmailMessage(response.data));
    } catch (error: any) {
      logger.error('Error getting message:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else if (error.response?.status === 404) {
        reply.status(404).send({ error: 'Message not found' });
      } else {
        reply.status(500).send({ error: 'Failed to get message' });
      }
    }
  });

  // Send email
  fastify.post('/gmail/send', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'to', 'subject', 'body'],
        properties: {
          userId: { type: 'string' },
          to: { type: 'string' },
          subject: { type: 'string' },
          body: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            threadId: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { userId, to, subject, body } = request.body as z.infer<typeof SendEmailSchema>;
      
      const gmail = await getGmailClient(userId);
      const message = {
        to,
        subject,
        text: body,
      };

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: Buffer.from(
            `To: ${message.to}\r\n` +
            `Subject: ${message.subject}\r\n\r\n` +
            `${message.text}`
          ).toString('base64'),
        },
      });

      reply.send(convertGmailMessage(response.data));
    } catch (error: any) {
      logger.error('Error sending email:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else {
        reply.status(500).send({ error: 'Failed to send email' });
      }
    }
  });
}; 