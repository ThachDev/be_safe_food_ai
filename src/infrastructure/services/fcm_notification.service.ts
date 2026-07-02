import { IUserRepository } from '../../domain/repositories/i_user.repository';

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

async function signJwt(payload: any, privateKeyPem: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
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

export class FcmNotificationService {
  private projectId: string;
  private clientEmail: string;
  private privateKey: string;

  constructor(
    private userRepository: IUserRepository,
    env: any
  ) {
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
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
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
      throw new Error(`Failed to obtain FCM Google access token: ${errText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  }

  async sendPushNotification(
    userId: number,
    fcmToken: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>
  ): Promise<boolean> {
    if (!this.projectId || !this.clientEmail || !this.privateKey) {
      console.warn('[FcmNotificationService] Firebase configuration variables are missing.');
      return false;
    }

    try {
      const accessToken = await this.getGoogleAccessToken();
      const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title,
              body,
            },
            data: dataPayload || {}
          }
        })
      });

      if (!response.ok) {
        const errData: any = await response.json();
        throw new Error(errData.error?.message || 'Failed to send FCM push notification');
      }

      console.log(`[FcmNotificationService] Push sent to user ${userId} successfully.`);
      return true;
    } catch (error: any) {
      console.error(`[FcmNotificationService] Failed to send push to user ${userId}:`, error.message);

      if (
        error.message && (
          error.message.includes('registration-token-not-registered') ||
          error.message.includes('not-registered') ||
          error.message.includes('invalid-argument')
        )
      ) {
        console.log(`[FcmNotificationService] Cleaning up inactive token for user ${userId}`);
        try {
          await this.userRepository.update(userId, { fcmToken: null });
        } catch (dbError) {
          console.error('[FcmNotificationService] Failed to clear invalid token from DB:', dbError);
        }
      }
      return false;
    }
  }
}
