import { Hono } from 'hono';
import { cors } from 'hono/cors';
import honoRoutes from './routes';

const app = new Hono<{ Bindings: any }>();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));

// HTTP Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  console.log(`--> ${c.req.method} ${c.req.url}`);
  await next();
  const duration = Date.now() - start;
  console.log(`<-- ${c.req.method} ${c.req.url} - ${c.res.status} (${duration}ms)`);
});

// Root welcome endpoint
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Welcome to the Safe Food AI API Server!',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Server is awake',
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.route('/api/v1', honoRoutes);

// 404 Handler
app.notFound((c) => {
  return c.json({
    success: false,
    code: 'NOT_FOUND',
    message: `Resource not found: ${c.req.method} ${c.req.url}`
  }, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error('[Global Error Handler]:', err);
  return c.json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred.',
    error: c.env.NODE_ENV === 'development' ? err.message : undefined
  }, 500);
});

export default app;
