import { gmail_v1, google } from 'googleapis';
import { SimplifiedMessage, MessageDetail } from '../types/gmail';
import { getToken, refreshTokenIfNeeded } from './auth';
import { logger } from '../utils/logger';

const gmail = google.gmail('v1');

function parseEmailAddress(header: gmail_v1.Schema$MessagePartHeader): string {
  const value = header.value || '';
  const match = value.match(/<(.+)>/) || value.match(/(.+)/);
  return match ? match[1].trim() : '';
}

function parseMessageHeaders(headers: gmail_v1.Schema$MessagePartHeader[] = []): {
  from: string;
  to: string[];
  subject: string;
  date: string;
} {
  const result = {
    from: '',
    to: [] as string[],
    subject: '',
    date: '',
  };

  headers.forEach((header) => {
    switch (header.name?.toLowerCase()) {
      case 'from':
        result.from = parseEmailAddress(header);
        break;
      case 'to':
        result.to = (header.value || '').split(',').map(email => parseEmailAddress({ value: email }));
        break;
      case 'subject':
        result.subject = header.value || '';
        break;
      case 'date':
        result.date = header.value || '';
        break;
    }
  });

  return result;
}

function getPlainTextBody(payload: gmail_v1.Schema$MessagePart): string {
  if (!payload.parts) {
    return payload.body?.data ? 
      Buffer.from(payload.body.data, 'base64').toString() : '';
  }

  const plainTextPart = payload.parts.find(
    part => part.mimeType === 'text/plain'
  );

  if (plainTextPart?.body?.data) {
    return Buffer.from(plainTextPart.body.data, 'base64').toString();
  }

  return '';
}

export async function listMessages(
  userId: string,
  maxResults: number = 10,
  query?: string
): Promise<SimplifiedMessage[]> {
  await refreshTokenIfNeeded(userId);
  const token = await getToken(userId);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  try {
    const response = await gmail.users.messages.list({
      auth,
      userId: 'me',
      maxResults,
      q: query,
    });

    const messages = response.data.messages || [];
    const messageDetails = await Promise.all(
      messages.map(async (message) => {
        const detail = await gmail.users.messages.get({
          auth,
          userId: 'me',
          id: message.id!,
        });

        const headers = parseMessageHeaders(detail.data.payload?.headers);
        
        return {
          id: message.id!,
          ...headers,
          snippet: detail.data.snippet || '',
        };
      })
    );

    return messageDetails;
  } catch (error) {
    logger.error('Error listing messages:', error);
    throw new Error('Failed to list messages');
  }
}

export async function getMessage(
  userId: string,
  messageId: string
): Promise<MessageDetail> {
  await refreshTokenIfNeeded(userId);
  const token = await getToken(userId);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  try {
    const response = await gmail.users.messages.get({
      auth,
      userId: 'me',
      id: messageId,
    });

    const message = response.data;
    const headers = parseMessageHeaders(message.payload?.headers);
    const body = getPlainTextBody(message.payload!);

    const attachments = message.payload?.parts
      ?.filter(part => part.filename && part.body)
      .map(part => ({
        filename: part.filename!,
        mimeType: part.mimeType!,
        size: parseInt(part.body?.size?.toString() || '0'),
      }));

    return {
      id: messageId,
      ...headers,
      body,
      snippet: message.snippet || '',
      attachments,
    };
  } catch (error) {
    logger.error('Error getting message:', error);
    throw new Error('Failed to get message');
  }
}

export async function sendMessage(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  await refreshTokenIfNeeded(userId);
  const token = await getToken(userId);
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  try {
    const message = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      auth,
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    logger.info(`Email sent to ${to}`);
  } catch (error) {
    logger.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

export async function getGmailClient(userId: string) {
  const token = await getToken(userId);
  if (!token) {
    throw new Error('No token found for user');
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Helper function to handle null values
function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}

// Helper function to convert Gmail message to our format
export function convertGmailMessage(message: any) {
  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    snippet: nullToUndefined(message.snippet),
    payload: message.payload,
    sizeEstimate: message.sizeEstimate,
    historyId: message.historyId,
    internalDate: message.internalDate,
  };
} 