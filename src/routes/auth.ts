import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthStateSchema, convertGoogleCredentials } from '../types/auth';
import { generateAuthUrl, getOAuth2Client, storeToken, getToken } from '../services/auth';
import { logger } from '../utils/logger';

interface GoogleApiError {
  response?: {
    status: number;
  };
  message: string;
}

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize OAuth flow
  fastify.get('/initiate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          redirectUrl: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            authUrl: { type: 'string' }
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
      const { userId, redirectUrl } = request.query as z.infer<typeof AuthStateSchema>;
      
      // Create state object for security
      const state = Buffer.from(JSON.stringify({ userId, redirectUrl })).toString('base64');
      
      const authUrl = generateAuthUrl(userId, state);
      reply.send({ authUrl });
    } catch (error) {
      logger.error('Error initiating auth:', error);
      reply.status(500).send({ error: 'Failed to initiate authentication' });
    }
  });

  // OAuth callback handler
  fastify.get('/callback', {
    schema: {
      querystring: {
        type: 'object',
        required: ['code', 'state'],
        properties: {
          code: { type: 'string' },
          state: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { code, state } = request.query as { code: string; state: string };
      
      // Decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString()) as z.infer<typeof AuthStateSchema>;
      
      // Exchange code for tokens
      const { tokens } = await getOAuth2Client().getToken(code);
      
      // Convert and store tokens
      const tokenData = convertGoogleCredentials(tokens);
      await storeToken(stateData.userId, tokenData);
      
      // Redirect to original URL or success page
      const redirectUrl = stateData.redirectUrl || '/auth-success.html';
      reply.redirect(redirectUrl);
    } catch (error) {
      logger.error('Error in auth callback:', error);
      reply.status(500).send({ error: 'Authentication failed' });
    }
  });

  // Get user profile
  fastify.get('/profile', {
    schema: {
      headers: {
        type: 'object',
        required: ['authorization'],
        properties: {
          authorization: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            name: { type: 'string' },
            picture: { type: 'string' }
          }
        },
        401: {
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
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ access_token: token });

      const { data } = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v2/userinfo'
      });

      reply.send(data);
    } catch (error: unknown) {
      logger.error('Error getting profile:', error);
      const apiError = error as GoogleApiError;
      if (apiError.response?.status === 401) {
        reply.status(401).send({ error: 'Unauthorized' });
      } else {
        reply.status(500).send({ error: 'Failed to get profile' });
      }
    }
  });
}; 