import { config } from 'dotenv';
import { buildServer } from './server';
import { logger } from './utils/logger';

// Load environment variables
config();

const start = async () => {
  try {
    const server = await buildServer();
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const host = process.env.HOST || 'localhost';

    await server.listen({ port, host });
    logger.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
};

start(); 