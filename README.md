# Google API Wrapper Service

A secure, scalable Google API wrapper service built with TypeScript and Fastify that enables AI agents to access Google services (Gmail and Calendar) via structured function calls.

## Features

- 🔒 Secure OAuth2 authentication flow
- 📧 Gmail API integration (list, read, send)
- 📅 Calendar API integration (list events, create events)
- ✅ Input/Output validation using Zod
- 📝 Comprehensive logging with Winston
- 🚀 Rate limiting support
- 🔐 Encrypted token storage

## Prerequisites

1. Node.js (v14 or higher)
2. npm (v6 or higher)
3. A Google Cloud Project with Gmail and Calendar APIs enabled
4. OAuth 2.0 credentials from Google Cloud Console

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd google-api-wrapper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your configuration:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `GOOGLE_REDIRECT_URI`: OAuth callback URL (e.g., http://localhost:3000/auth/callback)
   - `ENCRYPTION_KEY`: 32-character key for token encryption
   - Other configuration options as needed

## Development

Start the development server with hot reload:
```bash
# Unix/Linux/macOS
./scripts/start.sh

# Windows
scripts\start.bat
```

Or manually:
```bash
npm run dev
```

## Building for Production

Build the project:
```bash
# Unix/Linux/macOS
./scripts/build.sh

# Windows
scripts\build.bat
```

Or manually:
```bash
npm run build
```

## Running Examples

The project includes example scripts demonstrating how to use the API. You can run them using the provided scripts:

```bash
# Unix/Linux/macOS
./scripts/run-example.sh list_emails    # List Gmail messages
./scripts/run-example.sh create_event   # Create a calendar event

# Windows
scripts\run-example.bat list_emails    # List Gmail messages
scripts\run-example.bat create_event   # Create a calendar event
```

The scripts will:
1. Create a default `examples/.env` file if it doesn't exist
2. Check if authentication is needed
3. If needed, provide a URL to authenticate with Google
4. Once authenticated, perform the requested operation

### Example Environment Variables
The scripts create a default `examples/.env` file with:
```env
API_BASE_URL=http://localhost:3000
TEST_USER_ID=test_user
```

You can modify these values to match your setup.

### Available Examples

1. **List Gmail Messages** (`list_emails`)
   - Lists your most recent unread emails
   - Demonstrates Gmail API integration
   - Shows how to handle authentication flow

2. **Create Calendar Event** (`create_event`)
   - Creates a test event for tomorrow
   - Demonstrates Calendar API integration
   - Shows how to handle date/time formatting

## API Endpoints

### Authentication
- `GET /auth/initiate` - Start OAuth2 flow
  - Query params:
    - `userId`: Unique identifier for the user
    - `redirectUrl`: (optional) URL to redirect after authentication

- `GET /auth/callback` - OAuth2 callback handler
  - Automatically handles token exchange and storage

### Gmail Functions
- `POST /functions/gmail_list_messages`
  ```typescript
  {
    "userId": string,
    "maxResults": number (optional),
    "query": string (optional)
  }
  ```

- `POST /functions/gmail_get_message_detail`
  ```typescript
  {
    "userId": string,
    "messageId": string
  }
  ```

- `POST /functions/gmail_send_message`
  ```typescript
  {
    "userId": string,
    "to": string,
    "subject": string,
    "body": string
  }
  ```

### Calendar Functions
- `POST /functions/calendar_list_events`
  ```typescript
  {
    "userId": string,
    "startDate": string (ISO 8601),
    "endDate": string (ISO 8601),
    "maxResults": number (optional)
  }
  ```

- `POST /functions/calendar_create_event`
  ```typescript
  {
    "userId": string,
    "summary": string,
    "description": string (optional),
    "startDateTime": string (ISO 8601),
    "endDateTime": string (ISO 8601),
    "attendees": string[] (optional),
    "location": string (optional)
  }
  ```

## Security Considerations

1. Token Storage
   - All tokens are encrypted at rest using AES-256-CBC
   - Encryption key should be kept secure and rotated periodically

2. Scope Validation
   - Each API call validates required OAuth scopes
   - Prevents unauthorized access to APIs

3. Rate Limiting
   - Configurable rate limits per user and endpoint
   - Prevents abuse and ensures fair usage

4. Input Validation
   - All inputs are validated using Zod schemas
   - Prevents malformed or malicious requests

## Error Handling

The service uses standardized error responses:
```typescript
{
  "error": string,
  "message": string
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request (invalid input)
- 401: Unauthorized (no token)
- 403: Forbidden (insufficient scopes)
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

## Testing

Run the test suite:
```bash
# Unix/Linux/macOS
./scripts/test.sh

# Windows
scripts\test.bat
```

Or manually:
```bash
npm test
```

The test suite includes:
- Unit tests for core functionality
- Integration tests for API endpoints
- Coverage reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details 