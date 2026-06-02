const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const { HttpStatus } = require('./constants');

const app = express();

// Standard middlewares
app.use(cors({
  origin: '*', // Allows Flutter app connections; customize in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
