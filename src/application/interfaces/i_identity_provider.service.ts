export interface IIdentityProviderService {
  createUser(email: string, password: string, displayName: string | null): Promise<{ uid: string; email: string; displayName: string | null }>;
  createCustomToken(uid: string): Promise<string>;
  updatePassword(uid: string, newPassword: string): Promise<void>;
  getUserByEmail(email: string): Promise<{ uid: string; email: string }>;
}
