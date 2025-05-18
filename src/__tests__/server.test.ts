import { FastifyInstance } from 'fastify';
import { buildServer } from '../server';

describe('Server Setup', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should register CORS plugin', () => {
    expect(server.hasPlugin('@fastify/cors')).toBe(true);
  });

  it('should register Swagger plugin', () => {
    expect(server.hasPlugin('@fastify/swagger')).toBe(true);
  });

  it('should register Swagger UI plugin', () => {
    expect(server.hasPlugin('@fastify/swagger-ui')).toBe(true);
  });

  it('should register static file plugin', () => {
    expect(server.hasPlugin('@fastify/static')).toBe(true);
  });

  it('should register all route handlers', () => {
    const registeredRoutes = server.printRoutes();
    
    // Auth routes
    expect(registeredRoutes).toContain('├── initiate (GET, HEAD)');
    expect(registeredRoutes).toContain('├── callback (GET, HEAD)');
    expect(registeredRoutes).toContain('└── profile (GET, HEAD)');

    // Gmail routes
    expect(registeredRoutes).toContain('├── messages (GET, HEAD)');
    expect(registeredRoutes).toContain('└── :messageId (GET, HEAD)');
    expect(registeredRoutes).toContain('└── send (POST)');

    // Calendar routes
    expect(registeredRoutes).toContain('└── calendar/events (GET, HEAD, POST)');
    expect(registeredRoutes).toContain('└── :eventId (DELETE)');
  });

  it('should have global error handler', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/non-existent-route',
    });

    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.payload)).toHaveProperty('error');
  });

  it('should have correct swagger documentation', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/documentation/json',
    });

    expect(response.statusCode).toBe(200);
    const swaggerDoc = JSON.parse(response.payload);
    expect(swaggerDoc.info.title).toBe('Google API Wrapper');
    expect(swaggerDoc.info.version).toBe('1.0.0');
  });
}); 