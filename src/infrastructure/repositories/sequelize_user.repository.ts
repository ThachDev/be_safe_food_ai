import { injectable } from 'tsyringe';
import { IUserRepository } from '../../domain/repositories/i_user.repository';
import { User } from '../../domain/entities/user.entity';
import { PendingUser } from '../../domain/entities/pending_user.entity';
import { PasswordReset } from '../../domain/entities/password_reset.entity';

// Import existing sequelize models
const SequelizeUser = require('../../models/user.model');
const SequelizePendingUser = require('../../models/pending_user.model');
const SequelizePasswordReset = require('../../models/password_reset.model');

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
      record.healthGoals
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
      healthGoals: user.healthGoals
    });
    return this.mapToUserEntity(record);
  }

  async update(user: User): Promise<void> {
    await SequelizeUser.update({
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl,
      isOnboarded: user.isOnboarded,
      dietType: user.dietType,
      allergies: user.allergies,
      diseases: user.diseases,
      healthGoals: user.healthGoals
    }, { where: { id: user.id } });
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
