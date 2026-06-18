import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';
import { HttpStatus } from './shared/constants';

const app = express();

app.set('trust proxy', 1);

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, 
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP, please try again after a minute.'
  }
});
app.use(globalLimiter);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalJson = res.json;
  let responseBody: any;

  res.json = function (body: any) {
    responseBody = body;
    return originalJson.apply(res, arguments as any);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const sanitize = (body: any) => {
      if (!body || typeof body !== 'object') return body;
      
      const copy = JSON.parse(JSON.stringify(body));
      
      const truncateLongStrings = (obj: any) => {
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

app.use('/api/v1', apiRoutes);

app.get('/', (req: Request, res: Response) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Welcome to the Safe Food AI API Server!',
    version: '1.0.0'
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(HttpStatus.OK).json({
    success: true,
    message: 'Server is awake',
    timestamp: new Date().toISOString()
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Handler]:', err);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
