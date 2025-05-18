import { calendar_v3, google } from 'googleapis';
import { SimplifiedEvent, EventDetail } from '../types/calendar';
import { getToken, refreshTokenIfNeeded } from './auth';
import { logger } from '../utils/logger';

const calendar = google.calendar('v3');

function simplifyEvent(event: calendar_v3.Schema$Event): SimplifiedEvent {
  return {
    id: event.id!,
    summary: event.summary || '',
    description: nullToUndefined(event.description),
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    organizer: {
      email: event.organizer?.email || '',
      displayName: nullToUndefined(event.organizer?.displayName),
    },
    attendees: event.attendees?.map(attendee => ({
      email: attendee.email || '',
      displayName: nullToUndefined(attendee.displayName),
      responseStatus: nullToUndefined(attendee.responseStatus),
    })),
    location: nullToUndefined(event.location),
  };
}

function getEventDetail(event: calendar_v3.Schema$Event): EventDetail {
  return {
    ...simplifyEvent(event),
    created: event.created || '',
    updated: event.updated || '',
    status: event.status || '',
    htmlLink: event.htmlLink || '',
    colorId: nullToUndefined(event.colorId),
    creator: {
      email: event.creator?.email || '',
      displayName: nullToUndefined(event.creator?.displayName),
    },
    recurringEventId: nullToUndefined(event.recurringEventId),
    originalStartTime: event.originalStartTime ? {
      dateTime: event.originalStartTime.dateTime || '',
      timeZone: event.originalStartTime.timeZone || '',
    } : undefined,
  };
}

export async function listEvents(
  userId: string,
  startDate: string,
  endDate: string,
  maxResults: number = 10
): Promise<SimplifiedEvent[]> {
  await refreshTokenIfNeeded(userId);
  const token = await getToken(userId);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  try {
    const response = await calendar.events.list({
      auth,
      calendarId: 'primary',
      timeMin: startDate,
      timeMax: endDate,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    return events.map(simplifyEvent);
  } catch (error) {
    logger.error('Error listing events:', error);
    throw new Error('Failed to list events');
  }
}

export async function createEvent(
  userId: string,
  summary: string,
  startDateTime: string,
  endDateTime: string,
  description?: string,
  attendees?: string[],
  location?: string
): Promise<EventDetail> {
  await refreshTokenIfNeeded(userId);
  const token = await getToken(userId);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  const eventData: calendar_v3.Schema$Event = {
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
      auth,
      calendarId: 'primary',
      requestBody: eventData,
      sendUpdates: 'all',
    });

    return getEventDetail(response.data);
  } catch (error) {
    logger.error('Error creating event:', error);
    throw new Error('Failed to create event');
  }
}

export async function getCalendarClient(userId: string) {
  const token = await getToken(userId);
  if (!token) {
    throw new Error('No token found for user');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

// Helper function to handle null values
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

// Helper function to convert Google Calendar event to our format
export function convertGoogleEvent(event: any) {
  return {
    id: event.id,
    summary: event.summary,
    description: nullToUndefined(event.description),
    start: event.start,
    end: event.end,
    attendees: event.attendees?.map((attendee: any) => ({
      email: attendee.email,
      displayName: nullToUndefined(attendee.displayName),
      responseStatus: nullToUndefined(attendee.responseStatus),
    })),
    location: nullToUndefined(event.location),
    colorId: nullToUndefined(event.colorId),
    recurringEventId: nullToUndefined(event.recurringEventId),
  };
} 