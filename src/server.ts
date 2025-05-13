import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authRoutes } from '@/routes/auth';
import { gmailRoutes } from '@/routes/gmail';
import { calendarRoutes } from '@/routes/calendar';
import { staticPlugin } from '@/plugins/static';
import { logger } from '@/utils/logger';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register plugins
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  });

  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Google API Wrapper',
        description: 'API wrapper for Google services',
        version: '1.0.0',
      },
      host: `${process.env.HOST}:${process.env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  // Register static file serving
  await server.register(staticPlugin);

  // Register routes
  server.register(authRoutes, { prefix: '/auth' });
  server.register(gmailRoutes, { prefix: '/functions' });
  server.register(calendarRoutes, { prefix: '/functions' });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    logger.error(error);
    reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  return server;
} 