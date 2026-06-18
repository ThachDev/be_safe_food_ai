import { User } from '../entities/user.entity';
import { PendingUser } from '../entities/pending_user.entity';
import { PasswordReset } from '../entities/password_reset.entity';

export interface IUserRepository {
  findByFirebaseUid(uid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(user: User): Promise<void>;

  findPendingUserByEmail(email: string): Promise<PendingUser | null>;
  savePendingUser(pendingUser: Omit<PendingUser, 'id'> | PendingUser): Promise<PendingUser>;
  deletePendingUser(email: string): Promise<void>;

  findPasswordResetByEmail(email: string): Promise<PasswordReset | null>;
  savePasswordReset(reset: Omit<PasswordReset, 'id'> | PasswordReset): Promise<PasswordReset>;
  deletePasswordReset(email: string): Promise<void>;
}
