import { z } from 'zod';

export const ListEventsSchema = z.object({
  userId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxResults: z.number().optional().default(10),
});

export type ListEventsRequest = z.infer<typeof ListEventsSchema>;

export const CreateEventSchema = z.object({
  userId: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  attendees: z.array(z.string().email()).optional(),
  location: z.string().optional(),
});

export type CreateEventRequest = z.infer<typeof CreateEventSchema>;

export interface SimplifiedEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  organizer: {
    email: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
}

export interface EventDetail extends SimplifiedEvent {
  created: string;
  updated: string;
  status: string;
  htmlLink: string;
  colorId?: string;
  creator: {
    email: string;
    displayName?: string;
  };
  recurringEventId?: string;
  originalStartTime?: {
    dateTime: string;
    timeZone: string;
  };
} 