import { FastifyInstance } from 'fastify';
import { setupTestServer, mockUserProfile } from '../utils/test-utils';
import { jest } from '@jest/globals';
import { TokenData } from '@/types/auth';
import { OAuth2Client, Credentials } from 'google-auth-library';

// Mock the auth service
const mockOAuth2Client = {
  getToken: jest.fn().mockResolvedValue({
    tokens: {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      token_type: 'Bearer',
      expiry_date: 1747189870405,
    } as Credentials
  }),
  setCredentials: jest.fn(),
} as unknown as OAuth2Client;

jest.mock('../../services/auth', () => ({
  getToken: jest.fn().mockImplementation((): TokenData => ({
    access_token: 'test_access_token',
    refresh_token: 'test_refresh_token',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    token_type: 'Bearer',
    expiry_date: 1747189870405,
  })),
  storeToken: jest.fn().mockResolvedValue(Promise.resolve()),
  validateScopes: jest.fn().mockReturnValue(true),
  refreshTokenIfNeeded: jest.fn().mockResolvedValue(Promise.resolve()),
  getOAuth2Client: jest.fn().mockReturnValue(mockOAuth2Client),
  generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/mock-auth-url'),
}));

describe('Auth Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /auth/initiate', () => {
    it('should redirect to Google OAuth consent screen', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/initiate',
        query: {
          userId: 'test-user',
          redirectUrl: 'http://localhost:3000/callback'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('authUrl');
    });
  });

  describe('GET /auth/callback', () => {
    it('should handle successful OAuth callback', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/callback',
        query: {
          code: 'mock-auth-code',
          state: Buffer.from(JSON.stringify({
            userId: 'test-user',
            redirectUrl: 'http://localhost:3000/callback'
          })).toString('base64')
        }
      });

      expect(response.statusCode).toBe(302);
    });

    it('should handle OAuth callback errors', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/callback',
        query: {
          error: 'access_denied'
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: 'Bearer test_access_token'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toMatchObject(mockUserProfile);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/auth/profile'
      });

      expect(response.statusCode).toBe(401);
    });
  });
}); 