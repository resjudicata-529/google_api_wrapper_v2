import { FastifyInstance } from 'fastify';
import { setupTestServer, getMockAuthHeaders } from '../utils/test-utils';

describe('Calendar Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await setupTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /functions/calendar/events', () => {
    it('should fetch events when authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        query: {
          timeMin: new Date().toISOString(),
          timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: '10',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('events');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/calendar/events',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate time range parameters', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        query: {
          timeMin: 'invalid-date',
          timeMax: 'invalid-date',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /functions/calendar/events', () => {
    it('should create an event when authenticated', async () => {
      const event = {
        summary: 'Test Event',
        description: 'This is a test event',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        payload: event,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('id');
    });

    it('should validate event payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/functions/calendar/events',
        headers: getMockAuthHeaders(),
        payload: {
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('DELETE /functions/calendar/events/:id', () => {
    it('should delete an event when authenticated', async () => {
      const eventId = 'test-event-id';
      const response = await server.inject({
        method: 'DELETE',
        url: `/functions/calendar/events/${eventId}`,
        headers: getMockAuthHeaders(),
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/functions/calendar/events/non-existent-id',
        headers: getMockAuthHeaders(),
      });

      expect(response.statusCode).toBe(404);
    });
  });
}); 