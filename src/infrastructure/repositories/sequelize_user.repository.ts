import { injectable } from 'tsyringe';
import { IUserRepository } from '../../domain/repositories/i_user.repository';
import { User } from '../../domain/entities/user/user.entity';
import { PendingUser } from '../../domain/entities/auth/pending_user.entity';
import { PasswordReset } from '../../domain/entities/auth/password_reset.entity';

// Import existing sequelize models
import SequelizeUser from '../database/sequelize/models/user/user.model';
import SequelizePendingUser from '../database/sequelize/models/auth/pending_user.model';
import SequelizePasswordReset from '../database/sequelize/models/auth/password_reset.model';

@injectable()
export class SequelizeUserRepository implements IUserRepository {
  
  private mapToUserEntity(record: any): User {
    return new User(
      record.id,
      record.firebaseUid,
      record.email,
      record.displayName,
      record.photoUrl,
      record.isOnboarded,
      record.dietType,
      record.allergies,
      record.diseases,
      record.healthGoals,
      record.pushEnabled,
      record.emailEnabled,
      record.fcmToken
    );
  }

  private mapToPendingUserEntity(record: any): PendingUser {
    return new PendingUser(
      record.id,
      record.email,
      record.displayName,
      record.password,
      record.otp,
      record.expiresAt
    );
  }

  private mapToPasswordResetEntity(record: any): PasswordReset {
    return new PasswordReset(
      record.id,
      record.email,
      record.otp,
      record.expiresAt
    );
  }

  async findById(id: number): Promise<User | null> {
    const userModel = await SequelizeUser.findByPk(id);
    if (!userModel) return null;
    return this.mapToUserEntity(userModel);
  }

  async findByFirebaseUid(uid: string): Promise<User | null> {
    const record = await SequelizeUser.findOne({ where: { firebaseUid: uid } });
    if (!record) return null;
    return this.mapToUserEntity(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await SequelizeUser.findOne({ where: { email } });
    if (!record) return null;
    return this.mapToUserEntity(record);
  }

  async findAll(): Promise<User[]> {
    const users = await SequelizeUser.findAll();
    return users.map((u: any) => this.mapToUserEntity(u));
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const record = await SequelizeUser.create({
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      isOnboarded: user.isOnboarded,
      dietType: user.dietType,
      allergies: user.allergies,
      diseases: user.diseases,
      healthGoals: user.healthGoals,
      pushEnabled: user.pushEnabled,
      emailEnabled: user.emailEnabled,
      fcmToken: user.fcmToken
    });
    return this.mapToUserEntity(record);
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    await SequelizeUser.update(data, { where: { id } });
  }

  async findPendingUserByEmail(email: string): Promise<PendingUser | null> {
    const record = await SequelizePendingUser.findOne({ where: { email } });
    if (!record) return null;
    return this.mapToPendingUserEntity(record);
  }

  async savePendingUser(pendingUser: Omit<PendingUser, 'id'> | PendingUser): Promise<PendingUser> {
    if ('id' in pendingUser) {
      // update
      await SequelizePendingUser.update({
        displayName: pendingUser.displayName,
        password: pendingUser.passwordHash,
        otp: pendingUser.otp,
        expiresAt: pendingUser.expiresAt
      }, { where: { id: pendingUser.id } });
      return pendingUser as PendingUser;
    } else {
      // create
      const record = await SequelizePendingUser.create({
        email: pendingUser.email,
        displayName: pendingUser.displayName,
        password: pendingUser.passwordHash,
        otp: pendingUser.otp,
        expiresAt: pendingUser.expiresAt
      });
      return this.mapToPendingUserEntity(record);
    }
  }

  async deletePendingUser(email: string): Promise<void> {
    await SequelizePendingUser.destroy({ where: { email } });
  }

  async findPasswordResetByEmail(email: string): Promise<PasswordReset | null> {
    const record = await SequelizePasswordReset.findOne({ where: { email } });
    if (!record) return null;
    return this.mapToPasswordResetEntity(record);
  }

  async savePasswordReset(reset: Omit<PasswordReset, 'id'> | PasswordReset): Promise<PasswordReset> {
    if ('id' in reset) {
      await SequelizePasswordReset.update({
        otp: reset.otp,
        expiresAt: reset.expiresAt
      }, { where: { id: reset.id } });
      return reset as PasswordReset;
    } else {
      const record = await SequelizePasswordReset.create({
        email: reset.email,
        otp: reset.otp,
        expiresAt: reset.expiresAt
      });
      return this.mapToPasswordResetEntity(record);
    }
  }

  async deletePasswordReset(email: string): Promise<void> {
    await SequelizePasswordReset.destroy({ where: { email } });
  }
}
