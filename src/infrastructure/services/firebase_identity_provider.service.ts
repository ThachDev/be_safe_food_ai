import { IIdentityProviderService } from '../../application/interfaces/i_identity_provider.service';

function base64UrlEncode(arr: Uint8Array): string {
  let binary = '';
  const len = arr.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleanPem = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  
  const binaryDerString = atob(cleanPem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );
}

async function signJwt(payload: any, privateKeyPem: string, keyId?: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyId
  };

  const headerStr = base64UrlEncode(stringToUint8Array(JSON.stringify(header)));
  const payloadStr = base64UrlEncode(stringToUint8Array(JSON.stringify(payload)));
  const dataToSign = stringToUint8Array(`${headerStr}.${payloadStr}`);

  const privateKey = await importPrivateKey(privateKeyPem);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    dataToSign as any
  );
  
  const signatureStr = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${headerStr}.${payloadStr}.${signatureStr}`;
}

export class FirebaseIdentityProviderService implements IIdentityProviderService {
  private projectId: string;
  private clientEmail: string;
  private privateKey: string;

  constructor(env: any) {
    this.projectId = env.FIREBASE_PROJECT_ID;
    this.clientEmail = env.FIREBASE_CLIENT_EMAIL;
    this.privateKey = env.FIREBASE_PRIVATE_KEY
      ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : '';
  }

  private async getGoogleAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.clientEmail,
      scope: 'https://www.googleapis.com/auth/identitytoolkit',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const jwt = await signJwt(payload, this.privateKey);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to obtain Google access token: ${errText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  async createUser(email: string, passwordHash: string, displayName: string | null): Promise<{ uid: string; email: string; displayName: string | null; }> {
    const accessToken = await this.getGoogleAccessToken();
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password: passwordHash,
        displayName,
        emailVerified: true
      })
    });

    if (!response.ok) {
      const errData: any = await response.json();
      throw new Error(errData.error?.message || 'Failed to create user in Firebase');
    }

    const data: any = await response.json();
    return {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName || null
    };
  }

  async createCustomToken(uid: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.clientEmail,
      sub: this.clientEmail,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid: uid
    };
    
    // Custom token is signed using the service account private key
    return await signJwt(payload, this.privateKey);
  }

  async updatePassword(uid: string, newPassword: string): Promise<void> {
    const accessToken = await this.getGoogleAccessToken();
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts/${uid}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        password: newPassword
      })
    });

    if (!response.ok) {
      const errData: any = await response.json();
      throw new Error(errData.error?.message || 'Failed to update password in Firebase');
    }
  }

  async getUserByEmail(email: string): Promise<{ uid: string; email: string; }> {
    const accessToken = await this.getGoogleAccessToken();
    const url = `https://identitytoolkit.googleapis.com/v1/projects/${this.projectId}/accounts:lookup`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: [email]
      })
    });

    if (!response.ok) {
      const errData: any = await response.json();
      throw new Error(errData.error?.message || 'Failed to lookup user in Firebase');
    }

    const data: any = await response.json();
    if (!data.users || data.users.length === 0) {
      throw new Error('User not found in Firebase');
    }

    return {
      uid: data.users[0].localId,
      email: data.users[0].email
    };
  }
}
