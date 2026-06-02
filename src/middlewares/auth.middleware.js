const admin = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Access token is missing or invalid format. Expected format: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // If Firebase was not initialized, fail gracefully
    if (!admin || !admin.apps.length) {
      return res.status(503).json({
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Firebase Authentication service is not initialized on the server.'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Bind token payload information to request context
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name || '',
      picture: decodedToken.picture || ''
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error] Failed to verify ID Token:', error.message);
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token verification failed. The provided token may be expired or revoked.',
      error: error.message
    });
  }
};

module.exports = authMiddleware;
