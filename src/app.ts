const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes');
const { HttpStatus } = require('./constants');

const app = express();

// Trust proxy is required if running behind a reverse proxy like Render
app.set('trust proxy', 1);

// Global Rate Limiting: max 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, 
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP, please try again after a minute.'
  }
});
app.use(globalLimiter);

// Standard middlewares
app.use(cors({
  origin: '*', // Allows Flutter app connections; customize in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Custom Rich JSON Logger Middleware (Postman-style)
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;
  let responseBody;

  // Capture response payload
  res.json = function (body) {
    responseBody = body;
    return originalJson.apply(res, arguments);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Safely truncate large payloads (like Base64 strings) to keep console readable
    const sanitize = (body) => {
      if (!body || typeof body !== 'object') return body;
      
      const copy = JSON.parse(JSON.stringify(body));
      
      const truncateLongStrings = (obj) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string' && obj[key].length > 150) {
            obj[key] = `${obj[key].substring(0, 100)}... [truncated, length: ${obj[key].length}]`;
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            truncateLongStrings(obj[key]);
          }
        }
      };
      
      truncateLongStrings(copy);
      return copy;
    };

    console.log(`\n=================== [HTTP REQUEST/RESPONSE LOG] ===================`);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'authorization': req.headers.authorization ? 'Bearer [HIDDEN]' : undefined,
      },
      duration: `${duration}ms`,
      status: res.statusCode,
      requestBody: sanitize(req.body),
      responseBody: sanitize(responseBody),
    }, null, 2));
    console.log(`====================================================================\n`);
  });

  next();
});

// Register routes
app.use('/api/v1', apiRoutes);

// Base / Welcome endpoint
app.get('/', (req, res) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Welcome to the Safe Food AI API Server!',
    version: '1.0.0'
  });
});

// Health check endpoint for cron-job to keep server awake
app.get('/health', (req, res) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Server is awake',
    timestamp: new Date().toISOString()
  });
});

// Fallback 404 Route handler
app.use((req, res, next) => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
