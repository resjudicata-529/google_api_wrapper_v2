// Mock data that will be used across tests
interface GoogleApiError extends Error {
  response?: { status: number };
}

export const mockGoogleTokens = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600000,
};

export const mockUserProfile = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/picture.jpg',
};

export const mockGmailAPI = {
  users: {
    messages: {
      list: jest.fn().mockImplementation(({ q }) => {
        if (q === 'subject:Regression Test Email') {
          return Promise.resolve({
            data: {
              messages: [{ id: 'test-message-id', threadId: 'test-thread-id' }],
            },
          });
        }
        return Promise.resolve({ data: { messages: [] } });
      }),
      get: jest.fn().mockImplementation(({ id }) => {
        if (id === 'non-existent-id') {
          const error: GoogleApiError = new Error('Not Found');
          error.response = { status: 404 };
          return Promise.reject(error);
        }
        return Promise.resolve({
          data: {
            id: 'test-message-id',
            threadId: 'test-thread-id',
            snippet: 'Test message content',
          },
        });
      }),
      send: jest.fn().mockImplementation((params) => {
        if (!params.requestBody || !params.requestBody.raw) {
          const error: GoogleApiError = new Error('Bad Request');
          error.response = { status: 400 };
          return Promise.reject(error);
        }
        return Promise.resolve({
          data: {
            id: 'test-message-id',
            threadId: 'test-thread-id',
          },
        });
      }),
    },
  },
};

export const mockCalendarAPI = {
  events: {
    list: jest.fn().mockResolvedValue({
      data: {
        items: [{
          id: 'test-event-id',
          summary: 'Test Event',
          start: { dateTime: new Date().toISOString() },
          end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
        }],
      },
    }),
    insert: jest.fn().mockImplementation((params) => {
      const { summary, start, end } = params.requestBody;
      
      // Validate date formats
      try {
        if (start?.dateTime && isNaN(new Date(start.dateTime).getTime())) {
          const error: GoogleApiError = new Error('Bad Request');
          error.response = { status: 400 };
          return Promise.reject(error);
        }
        if (end?.dateTime && isNaN(new Date(end.dateTime).getTime())) {
          const error: GoogleApiError = new Error('Bad Request');
          error.response = { status: 400 };
          return Promise.reject(error);
        }
      } catch {
        const error: GoogleApiError = new Error('Bad Request');
        error.response = { status: 400 };
        return Promise.reject(error);
      }

      if (!summary || !start || !end) {
        const error: GoogleApiError = new Error('Bad Request');
        error.response = { status: 400 };
        return Promise.reject(error);
      }

      return Promise.resolve({
        data: {
          id: 'test-event-id',
          summary,
          start,
          end,
        },
      });
    }),
    delete: jest.fn().mockImplementation(({ eventId }) => {
      if (eventId === 'non-existent-id') {
        const error: GoogleApiError = new Error('Not Found');
        error.response = { status: 404 };
        return Promise.reject(error);
      }
      return Promise.resolve({});
    }),
  },
};

export const mockOAuth2Client = {
  generateAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/mock-auth-url'),
  getToken: jest.fn().mockResolvedValue({ tokens: mockGoogleTokens }),
  setCredentials: jest.fn(),
  request: jest.fn().mockImplementation((params) => {
    if (params.url === 'https://www.googleapis.com/oauth2/v2/userinfo') {
      if (!params.headers?.Authorization || params.headers.Authorization === 'Bearer invalid-token') {
        const error: GoogleApiError = new Error('Unauthorized');
        error.response = { status: 401 };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: mockUserProfile });
    }
    return Promise.reject(new Error('Invalid request'));
  }),
}; 