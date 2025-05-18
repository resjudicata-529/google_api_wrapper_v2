import { google } from 'googleapis';
import { mockOAuth2Client, mockGmailAPI, mockCalendarAPI, mockGoogleTokens } from '../utils/mocks';
import { jest } from '@jest/globals';

// Mock token storage
const mockTokenStore = new Map();

// Mock auth service
jest.mock('../../services/auth', () => ({
  getToken: jest.fn().mockImplementation((userId) => {
    return mockTokenStore.get(userId) || mockGoogleTokens;
  }),
  storeToken: jest.fn().mockImplementation((userId, token) => {
    mockTokenStore.set(userId, token);
    return Promise.resolve();
  }),
  validateScopes: jest.fn().mockReturnValue(true),
  refreshTokenIfNeeded: jest.fn().mockImplementation(() => Promise.resolve()),
  getOAuth2Client: jest.fn().mockReturnValue(mockOAuth2Client),
  generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/mock-auth-url'),
}));

// Mock Google APIs
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client),
    },
    gmail: jest.fn().mockReturnValue(mockGmailAPI),
    calendar: jest.fn().mockReturnValue(mockCalendarAPI),
  },
}));

// Mock environment variables
process.env.GOOGLE_CLIENT_ID = 'mock-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/google/callback';
process.env.ENCRYPTION_KEY = 'mock-encryption-key';

// Mock Winston logger to prevent console noise during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Export for use in test files
export { mockTokenStore }; 