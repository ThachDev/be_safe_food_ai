"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const routes_1 = __importDefault(require("./routes"));
const constants_1 = require("./shared/constants");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again after a minute.'
    }
});
app.use(globalLimiter);
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;
    let responseBody;
    res.json = function (body) {
        responseBody = body;
        return originalJson.apply(res, arguments);
    };
    res.on('finish', () => {
        const duration = Date.now() - start;
        const sanitize = (body) => {
            if (!body || typeof body !== 'object')
                return body;
            const copy = JSON.parse(JSON.stringify(body));
            const truncateLongStrings = (obj) => {
                for (const key in obj) {
                    if (typeof obj[key] === 'string' && obj[key].length > 150) {
                        obj[key] = `${obj[key].substring(0, 100)}... [truncated, length: ${obj[key].length}]`;
                    }
                    else if (typeof obj[key] === 'object' && obj[key] !== null) {
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
app.use('/api/v1', routes_1.default);
app.get('/', (req, res) => {
    res.status(constants_1.HttpStatus.OK).json({
        success: true,
        message: 'Welcome to the Safe Food AI API Server!',
        version: '1.0.0'
    });
});
app.get('/health', (req, res) => {
    res.status(constants_1.HttpStatus.OK).json({
        success: true,
        message: 'Server is awake',
        timestamp: new Date().toISOString()
    });
});
app.use((req, res, next) => {
    res.status(constants_1.HttpStatus.NOT_FOUND).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Resource not found: ${req.method} ${req.originalUrl}`
    });
});
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]:', err);
    res.status(constants_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
exports.default = app;
