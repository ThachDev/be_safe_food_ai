import { Context, Next } from 'hono';

let cachedJwks: any = null;
let jwksTimestamp = 0;

async function getGooglePublicKeys(): Promise<any> {
  const now = Date.now();
  if (cachedJwks && (now - jwksTimestamp < 3600 * 1000)) {
    return cachedJwks;
  }
  const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!res.ok) {
    throw new Error('Failed to fetch Google public JWKs');
  }
  cachedJwks = await res.json();
  jwksTimestamp = now;
  return cachedJwks;
}

async function importJwk(jwk: any): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['verify']
  );
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyFirebaseIdToken(token: string, projectId: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('JWT must have 3 parts');
  }

  const [headerStr, payloadStr, signatureStr] = parts;
  
  // Parse header and payload
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerStr)));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadStr)));

  const kid = header.kid;
  if (!kid) {
    throw new Error('JWT header missing kid');
  }

  // Fetch Google public keys and find matching JWK
  const jwks = await getGooglePublicKeys();
  const jwk = jwks.keys.find((k: any) => k.kid === kid);
  if (!jwk) {
    throw new Error('No matching public key found for kid');
  }

  // Import key and verify signature
  const publicKey = await importJwk(jwk);
  const dataToVerify = new TextEncoder().encode(`${headerStr}.${payloadStr}`);
  const signature = base64UrlDecode(signatureStr);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signature as any,
    dataToVerify as any
  );

  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // Verify claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token has expired');
  }

  const expectedIssuer = `https://securetoken.google.com/${projectId}`;
  if (payload.iss !== expectedIssuer) {
    throw new Error(`Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`);
  }

  if (payload.aud !== projectId) {
    throw new Error(`Invalid audience: expected ${projectId}, got ${payload.aud}`);
  }

  return payload;
}

export const authMiddleware = async (c: Context<any>, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Access token is missing or invalid format. Expected format: Bearer <token>'
    }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const projectId = c.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      return c.json({
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        message: 'FIREBASE_PROJECT_ID is not configured on the server.'
      }, 503);
    }

    const decodedToken = await verifyFirebaseIdToken(token, projectId);
    
    // Set user on context
    c.set('user', {
      uid: decodedToken.sub, // 'sub' is the Firebase UID
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.display_name || '',
      picture: decodedToken.picture || ''
    });

    await next();
  } catch (error: any) {
    console.error('[Auth Middleware Error] Failed to verify ID Token:', error.message);
    return c.json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Token verification failed. The provided token may be expired or revoked.',
      error: error.message
    }, 401);
  }
};
