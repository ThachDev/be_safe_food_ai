import { User } from '../entities/user/user.entity';
import { PendingUser } from '../entities/auth/pending_user.entity';
import { PasswordReset } from '../entities/auth/password_reset.entity';

export interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findByFirebaseUid(uid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: number, data: Partial<User>): Promise<void>;

  findPendingUserByEmail(email: string): Promise<PendingUser | null>;
  savePendingUser(pendingUser: Omit<PendingUser, 'id'> | PendingUser): Promise<PendingUser>;
  deletePendingUser(email: string): Promise<void>;

  findPasswordResetByEmail(email: string): Promise<PasswordReset | null>;
  savePasswordReset(reset: Omit<PasswordReset, 'id'> | PasswordReset): Promise<PasswordReset>;
  deletePasswordReset(email: string): Promise<void>;
}
