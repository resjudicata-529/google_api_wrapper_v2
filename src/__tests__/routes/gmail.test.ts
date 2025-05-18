import { FastifyInstance } from 'fastify';
import { setupTestServer, getMockAuthHeaders } from '../utils/test-utils';

describe('Gmail Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /functions/gmail/messages', () => {
    it('should fetch messages when authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/gmail/messages',
        headers: getMockAuthHeaders(),
        query: {
          maxResults: '10',
          q: 'test',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('messages');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/gmail/messages',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /functions/gmail/message/:id', () => {
    it('should fetch a specific message when authenticated', async () => {
      const messageId = 'test-message-id';
      const response = await server.inject({
        method: 'GET',
        url: `/functions/gmail/message/${messageId}`,
        headers: getMockAuthHeaders(),
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('id', messageId);
    });

    it('should return 404 for non-existent message', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/gmail/message/non-existent-id',
        headers: getMockAuthHeaders(),
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /functions/gmail/send', () => {
    it('should send email when authenticated', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/functions/gmail/send',
        headers: getMockAuthHeaders(),
        payload: {
          to: 'recipient@example.com',
          subject: 'Test Email',
          body: 'This is a test email',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('messageId');
    });

    it('should validate email payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/functions/gmail/send',
        headers: getMockAuthHeaders(),
        payload: {
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });
}); 