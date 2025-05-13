import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AuthStateSchema } from '../types/auth';
import { generateAuthUrl, getOAuth2Client, storeToken } from '../services/auth';
import { logger } from '../utils/logger';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize OAuth flow
  fastify.get('/initiate', {
    schema: {
      querystring: z.object({
        userId: z.string(),
        redirectUrl: z.string().optional(),
      }),
    },
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
  fastify.get('/callback', async (request, reply) => {
    try {
      const { code, state } = request.query as { code: string; state: string };
      
      // Decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString()) as z.infer<typeof AuthStateSchema>;
      
      // Exchange code for tokens
      const { tokens } = await getOAuth2Client().getToken(code);
      
      // Store tokens
      await storeToken(stateData.userId, tokens);
      
      // Redirect to original URL or success page
      const redirectUrl = stateData.redirectUrl || '/auth-success.html';
      reply.redirect(redirectUrl);
    } catch (error) {
      logger.error('Error in auth callback:', error);
      reply.status(500).send({ error: 'Authentication failed' });
    }
  });
}; 