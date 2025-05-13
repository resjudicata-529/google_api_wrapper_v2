import { OAuth2Client, Credentials } from 'google-auth-library';
import CryptoJS from 'crypto-js';
import { TokenData, StoredTokenData, EncryptedToken, REQUIRED_SCOPES } from '../types/auth';
import { logger } from '../utils/logger';

// In-memory token storage (replace with database in production)
const tokenStore = new Map<string, StoredTokenData>();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function encryptToken(token: TokenData): EncryptedToken {
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = process.env.ENCRYPTION_KEY || '';
  const jsonStr = JSON.stringify(token);
  
  const encrypted = CryptoJS.AES.encrypt(jsonStr, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    iv: iv.toString(),
    content: encrypted.toString()
  };
}

export function decryptToken(encrypted: EncryptedToken): TokenData {
  const key = process.env.ENCRYPTION_KEY || '';
  const bytes = CryptoJS.AES.decrypt(encrypted.content, key, {
    iv: CryptoJS.enc.Hex.parse(encrypted.iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedStr);
}

export async function storeToken(userId: string, token: TokenData): Promise<void> {
  const encrypted = encryptToken(token);
  const scopes = token.scope.split(' ');
  
  tokenStore.set(userId, {
    ...encrypted,
    userId,
    scopes
  });
  
  logger.info(`Stored token for user ${userId}`);
}

export async function getToken(userId: string): Promise<TokenData | null> {
  const storedToken = tokenStore.get(userId);
  if (!storedToken) {
    return null;
  }

  const { iv, content } = storedToken;
  return decryptToken({ iv, content });
}

export function validateScopes(userId: string, requiredScopes: string[]): boolean {
  const storedToken = tokenStore.get(userId);
  if (!storedToken) {
    return false;
  }

  return requiredScopes.every(scope => storedToken.scopes.includes(scope));
}

export async function refreshTokenIfNeeded(userId: string): Promise<void> {
  const token = await getToken(userId);
  if (!token) {
    throw new Error('No token found for user');
  }

  const expiryDate = token.expiry_date;
  const now = Date.now();

  // Refresh if token expires in less than 5 minutes
  if (expiryDate - now < 5 * 60 * 1000) {
    oauth2Client.setCredentials(token);
    const response = await oauth2Client.refreshAccessToken();
    const newToken: TokenData = {
      access_token: response.credentials.access_token!,
      refresh_token: response.credentials.refresh_token || token.refresh_token,
      token_type: response.credentials.token_type || 'Bearer',
      scope: response.credentials.scope || token.scope,
      expiry_date: response.credentials.expiry_date!,
    };
    await storeToken(userId, newToken);
    logger.info(`Refreshed token for user ${userId}`);
  }
}

export function getOAuth2Client(): OAuth2Client {
  return oauth2Client;
}

export function generateAuthUrl(userId: string, state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: REQUIRED_SCOPES,
    state: state,
    prompt: 'consent'
  });
} 