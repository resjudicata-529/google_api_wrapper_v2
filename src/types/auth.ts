import { z } from 'zod';

export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.string(),
  expiry_date: z.number(),
});

export type TokenData = z.infer<typeof TokenSchema>;

export interface EncryptedToken {
  iv: string;
  content: string;
}

export interface StoredTokenData extends EncryptedToken {
  userId: string;
  scopes: string[];
}

export const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

export const AuthStateSchema = z.object({
  userId: z.string(),
  redirectUrl: z.string().optional(),
}); 