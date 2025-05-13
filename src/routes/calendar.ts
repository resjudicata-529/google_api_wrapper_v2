import { FastifyPluginAsync } from 'fastify';
import {
  ListEventsSchema,
  CreateEventSchema,
} from '../types/calendar';
import { validateScopes } from '../services/auth';
import { listEvents, createEvent } from '../services/calendar';
import { logger } from '../utils/logger';

const CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_WRITE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export const calendarRoutes: FastifyPluginAsync = async (fastify) => {
  // List events
  fastify.post('/calendar_list_events', {
    schema: {
      body: ListEventsSchema,
    },
  }, async (request, reply) => {
    try {
      const { userId, startDate, endDate, maxResults } = request.body;

      if (!validateScopes(userId, [CALENDAR_READ_SCOPE])) {
        return reply.status(403).send({
          error: 'Missing required Calendar read scope',
        });
      }

      const events = await listEvents(userId, startDate, endDate, maxResults);
      reply.send({ events });
    } catch (error) {
      logger.error('Error listing events:', error);
      reply.status(500).send({ error: 'Failed to list events' });
    }
  });

  // Create event
  fastify.post('/calendar_create_event', {
    schema: {
      body: CreateEventSchema,
    },
  }, async (request, reply) => {
    try {
      const {
        userId,
        summary,
        startDateTime,
        endDateTime,
        description,
        attendees,
        location,
      } = request.body;

      if (!validateScopes(userId, [CALENDAR_WRITE_SCOPE])) {
        return reply.status(403).send({
          error: 'Missing required Calendar write scope',
        });
      }

      const event = await createEvent(
        userId,
        summary,
        startDateTime,
        endDateTime,
        description,
        attendees,
        location
      );

      reply.send({ event });
    } catch (error) {
      logger.error('Error creating event:', error);
      reply.status(500).send({ error: 'Failed to create event' });
    }
  });
}; 