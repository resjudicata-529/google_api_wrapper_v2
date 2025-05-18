import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getCalendarClient, convertGoogleEvent } from '../services/calendar';
import { logger } from '../utils/logger';

const ListEventsSchema = z.object({
  userId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxResults: z.string().optional(),
});

const CreateEventSchema = z.object({
  userId: z.string(),
  summary: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  description: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  location: z.string().optional(),
});

export const calendarRoutes: FastifyPluginAsync = async (fastify) => {
  // List events
  fastify.get('/calendar/events', {
    schema: {
      querystring: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          maxResults: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  summary: { type: 'string' },
                  description: { type: 'string' },
                  start: { type: 'string' },
                  end: { type: 'string' }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
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
      const { userId, startDate, endDate, maxResults } = request.query as z.infer<typeof ListEventsSchema>;
      
      const calendar = await getCalendarClient(userId);
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate || new Date().toISOString(),
        timeMax: endDate,
        maxResults: maxResults ? parseInt(maxResults) : 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items?.map(convertGoogleEvent) || [];
      reply.send({ events });
    } catch (error: any) {
      logger.error('Error listing events:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else if (error.response?.status === 404) {
        reply.status(404).send({ error: 'Calendar not found' });
      } else {
        reply.status(500).send({ error: 'Failed to list events' });
      }
    }
  });

  // Create event
  fastify.post('/calendar/events', {
    schema: {
      body: {
        type: 'object',
        required: ['userId', 'summary', 'startDateTime', 'endDateTime'],
        properties: {
          userId: { type: 'string' },
          summary: { type: 'string' },
          startDateTime: { type: 'string' },
          endDateTime: { type: 'string' },
          description: { type: 'string' },
          attendees: {
            type: 'array',
            items: { type: 'string' }
          },
          location: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            start: { type: 'string' },
            end: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
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
      // Validate request body using Zod
      const result = CreateEventSchema.safeParse(request.body);
      if (!result.success) {
        reply.status(400).send({ error: 'Invalid request body' });
        return;
      }

      const {
        userId,
        summary,
        startDateTime,
        endDateTime,
        description,
        attendees,
        location,
      } = result.data;

      const calendar = await getCalendarClient(userId);
      const event = {
        summary,
        description,
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC',
        },
        attendees: attendees?.map(email => ({ email })),
        location,
      };

      try {
        const response = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        reply.send(convertGoogleEvent(response.data));
      } catch (error: any) {
        if (error.response?.status === 400) {
          reply.status(400).send({ error: 'Invalid event data' });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      logger.error('Error creating event:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else if (error.response?.status === 400) {
        reply.status(400).send({ error: 'Invalid event data' });
      } else {
        reply.status(500).send({ error: 'Failed to create event' });
      }
    }
  });

  // Delete event
  fastify.delete('/calendar/events/:eventId', {
    schema: {
      params: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
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
      const { eventId } = request.params as { eventId: string };
      const { userId } = request.query as { userId: string };

      if (!eventId) {
        reply.status(400).send({ error: 'Event ID is required' });
        return;
      }

      const calendar = await getCalendarClient(userId);
      try {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId,
        });
        reply.send({ success: true });
      } catch (error: any) {
        if (error.response?.status === 404) {
          reply.status(404).send({ error: 'Event not found' });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      logger.error('Error deleting event:', error);
      if (error.message === 'No token found for user') {
        reply.status(401).send({ error: 'Unauthorized' });
      } else {
        reply.status(500).send({ error: 'Failed to delete event' });
      }
    }
  });
}; 