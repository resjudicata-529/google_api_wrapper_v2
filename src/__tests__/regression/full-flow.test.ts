import { FastifyInstance } from 'fastify';
import { setupTestServer, getMockAuthHeaders } from '../utils/test-utils';
import { mockTokenStore } from '../setup/jest.setup';
import { jest, beforeEach, afterEach } from '@jest/globals';

describe('Full Application Flow', () => {
  let server: FastifyInstance;
  let eventId: string;
  let messageId: string;
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  beforeEach(() => {
    mockTokenStore.clear();
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should complete the full authentication process', async () => {
      // 1. Start OAuth flow
      const authResponse = await server.inject({
        method: 'GET',
        url: '/auth/initiate',
        query: {
          userId: testUserId,
          redirectUrl: 'http://localhost:3000/auth-success'
        }
      });
      expect(authResponse.statusCode).toBe(200);
      const authData = JSON.parse(authResponse.payload);
      expect(authData).toHaveProperty('authUrl');
      expect(authData.authUrl).toContain('accounts.google.com');

      // 2. Handle OAuth callback
      const state = Buffer.from(JSON.stringify({
        userId: testUserId,
        redirectUrl: 'http://localhost:3000/auth-success'
      })).toString('base64');

      const callbackResponse = await server.inject({
        method: 'GET',
        url: '/auth/callback',
        query: {
          code: 'mock-auth-code',
          state
        }
      });
      expect(callbackResponse.statusCode).toBe(302);
      expect(callbackResponse.headers.location).toBe('http://localhost:3000/auth-success');
    });
  });

  describe('Calendar Operations Flow', () => {
    it('should perform full calendar operations lifecycle', async () => {
      // 1. Create a calendar event
      const createEventResponse = await server.inject({
        method: 'POST',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        payload: {
          userId: testUserId,
          summary: 'Regression Test Event',
          description: 'Testing full application flow',
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }
      });
      expect(createEventResponse.statusCode).toBe(200);
      const eventData = JSON.parse(createEventResponse.payload);
      expect(eventData).toHaveProperty('id');
      eventId = eventData.id;

      // 2. List events and verify the created event
      const listEventsResponse = await server.inject({
        method: 'GET',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        query: {
          userId: testUserId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }
      });
      expect(listEventsResponse.statusCode).toBe(200);
      const events = JSON.parse(listEventsResponse.payload);
      expect(events.events).toContainEqual(expect.objectContaining({ id: eventId }));

      // 3. Delete the event
      const deleteEventResponse = await server.inject({
        method: 'DELETE',
        url: `/functions/calendar/events/${eventId}`,
        headers: getMockAuthHeaders(),
        query: {
          userId: testUserId
        }
      });
      expect(deleteEventResponse.statusCode).toBe(200);
    });
  });

  describe('Gmail Operations Flow', () => {
    it('should perform full email operations lifecycle', async () => {
      // 1. Send an email
      const sendEmailResponse = await server.inject({
        method: 'POST',
        url: '/functions/gmail/send',
        headers: getMockAuthHeaders(),
        payload: {
          userId: testUserId,
          to: 'test@example.com',
          subject: 'Regression Test Email',
          body: 'Testing full application flow',
        }
      });
      expect(sendEmailResponse.statusCode).toBe(200);
      const emailData = JSON.parse(sendEmailResponse.payload);
      expect(emailData).toHaveProperty('id');
      messageId = emailData.id;

      // 2. List messages and verify the sent email
      const listMessagesResponse = await server.inject({
        method: 'GET',
        url: '/functions/gmail/messages',
        headers: getMockAuthHeaders(),
        query: {
          userId: testUserId,
          query: 'subject:Regression Test Email',
          maxResults: '10'
        }
      });
      expect(listMessagesResponse.statusCode).toBe(200);
      const messages = JSON.parse(listMessagesResponse.payload);
      expect(messages.messages).toContainEqual(expect.objectContaining({ id: messageId }));

      // 3. Get specific message
      const getMessageResponse = await server.inject({
        method: 'GET',
        url: `/functions/gmail/message/${messageId}`,
        headers: getMockAuthHeaders(),
        query: {
          userId: testUserId
        }
      });
      expect(getMessageResponse.statusCode).toBe(200);
      const message = JSON.parse(getMessageResponse.payload);
      expect(message).toHaveProperty('id', messageId);
    });
  });

  describe('Error Handling Flow', () => {
    it('should properly handle various error scenarios', async () => {
      // 1. Invalid authentication
      const invalidAuthResponse = await server.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: { authorization: 'Bearer invalid-token' }
      });
      expect(invalidAuthResponse.statusCode).toBe(401);

      // 2. Invalid calendar event creation
      const invalidEventResponse = await server.inject({
        method: 'POST',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        payload: {
          userId: testUserId,
          summary: 'Test Event',
          startDateTime: 'invalid-date',
          endDateTime: 'invalid-date'
        }
      });
      expect(invalidEventResponse.statusCode).toBe(400);

      // 3. Non-existent resources
      const nonExistentMessageResponse = await server.inject({
        method: 'GET',
        url: '/functions/gmail/message/non-existent-id',
        headers: getMockAuthHeaders(),
        query: {
          userId: testUserId
        }
      });
      expect(nonExistentMessageResponse.statusCode).toBe(404);
    });
  });
}); 