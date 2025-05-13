import { z } from 'zod';

export const ListMessagesSchema = z.object({
  userId: z.string(),
  maxResults: z.number().optional().default(10),
  query: z.string().optional(),
});

export type ListMessagesRequest = z.infer<typeof ListMessagesSchema>;

export const GetMessageSchema = z.object({
  userId: z.string(),
  messageId: z.string(),
});

export type GetMessageRequest = z.infer<typeof GetMessageSchema>;

export const SendMessageSchema = z.object({
  userId: z.string(),
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

export type SendMessageRequest = z.infer<typeof SendMessageSchema>;

export interface SimplifiedMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

export interface MessageDetail extends SimplifiedMessage {
  body: string;
  to: string[];
  cc?: string[];
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
} 