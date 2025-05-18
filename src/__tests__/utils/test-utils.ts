import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { mockGoogleTokens, mockUserProfile } from './mocks';

export { mockGoogleTokens, mockUserProfile };

export function getMockAuthHeaders() {
  return {
    authorization: `Bearer ${mockGoogleTokens.access_token}`,
  };
}

// Server setup helper
export async function setupTestServer(): Promise<FastifyInstance> {
  // Set environment variables before building server
  process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
  process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
  process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
  process.env.ENCRYPTION_KEY = 'mock-encryption-key';
  
  const server = await buildServer();
  await server.ready();
  return server;
} 