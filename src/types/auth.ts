import { z } from 'zod';
import { Credentials } from 'google-auth-library';

export const TokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  scope: z.string(),
  token_type: z.string().default('Bearer'),
  expiry_date: z.number(),
});

export type TokenData = {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
};

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

export function convertGoogleCredentials(creds: Credentials): TokenData {
  if (!creds.access_token) {
    throw new Error('Access token is required');
  }
  
  return {
    access_token: creds.access_token,
    refresh_token: creds.refresh_token || undefined,
    scope: creds.scope || REQUIRED_SCOPES.join(' '),
    token_type: creds.token_type || 'Bearer',
    expiry_date: creds.expiry_date || Date.now() + 3600000, // Default 1 hour expiry
  };
} 