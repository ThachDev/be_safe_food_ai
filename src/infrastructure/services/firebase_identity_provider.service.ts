import { injectable } from 'tsyringe';
import { IIdentityProviderService } from '../../application/interfaces/i_identity_provider.service';

import admin from '../external/firebase';

@injectable()
export class FirebaseIdentityProviderService implements IIdentityProviderService {
  async createUser(email: string, passwordHash: string, displayName: string | null): Promise<{ uid: string; email: string; displayName: string | null; }> {
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: passwordHash,
      displayName: displayName,
      emailVerified: true
    });
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || null
    };
  }

  async createCustomToken(uid: string): Promise<string> {
    return await admin.auth().createCustomToken(uid);
  }

  async updatePassword(uid: string, newPassword: string): Promise<void> {
    await admin.auth().updateUser(uid, {
      password: newPassword
    });
  }

  async getUserByEmail(email: string): Promise<{ uid: string; email: string; }> {
    const firebaseUser = await admin.auth().getUserByEmail(email);
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || ''
    };
  }
}
