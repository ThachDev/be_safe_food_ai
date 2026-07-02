import { IUserRepository } from '../../domain/repositories/i_user.repository';
import { User } from '../../domain/entities/user/user.entity';
import { PendingUser } from '../../domain/entities/auth/pending_user.entity';
import { PasswordReset } from '../../domain/entities/auth/password_reset.entity';

export class D1UserRepository implements IUserRepository {
  constructor(private db: any, private kv: any) {}

  private mapToUserEntity(row: any): User {
    return new User(
      row.id,
      row.firebase_uid,
      row.email,
      row.display_name,
      row.photo_url,
      row.is_onboarded === 1,
      row.diet_type,
      row.allergies ? JSON.parse(row.allergies) : [],
      row.diseases ? JSON.parse(row.diseases) : [],
      row.health_goals ? JSON.parse(row.health_goals) : [],
      row.push_enabled === 1,
      row.email_enabled === 1,
      row.fcm_token
    );
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();
    if (!row) return null;
    return this.mapToUserEntity(row);
  }

  async findByFirebaseUid(uid: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE firebase_uid = ?')
      .bind(uid)
      .first();
    if (!row) return null;
    return this.mapToUserEntity(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    if (!row) return null;
    return this.mapToUserEntity(row);
  }

  async findAll(): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users')
      .all();
    return (results || []).map((row: any) => this.mapToUserEntity(row));
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await this.db
      .prepare(
        `INSERT INTO users (
          firebase_uid, email, display_name, photo_url, is_onboarded, 
          diet_type, allergies, diseases, health_goals, push_enabled, 
          email_enabled, fcm_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        user.firebaseUid,
        user.email,
        user.displayName || null,
        user.photoUrl || null,
        user.isOnboarded ? 1 : 0,
        user.dietType || 'Bình thường',
        JSON.stringify(user.allergies || []),
        JSON.stringify(user.diseases || []),
        JSON.stringify(user.healthGoals || []),
        user.pushEnabled !== false ? 1 : 0,
        user.emailEnabled !== false ? 1 : 0,
        user.fcmToken || null
      )
      .run();

    const lastId = result.meta.last_row_id || 1;
    return new User(
      lastId,
      user.firebaseUid,
      user.email,
      user.displayName || null,
      user.photoUrl || null,
      user.isOnboarded,
      user.dietType || 'Bình thường',
      user.allergies || [],
      user.diseases || [],
      user.healthGoals || [],
      user.pushEnabled !== false,
      user.emailEnabled !== false,
      user.fcmToken || null
    );
  }

  async update(id: number, data: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.firebaseUid !== undefined) {
      fields.push('firebase_uid = ?');
      values.push(data.firebaseUid);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(data.displayName);
    }
    if (data.photoUrl !== undefined) {
      fields.push('photo_url = ?');
      values.push(data.photoUrl);
    }
    if (data.isOnboarded !== undefined) {
      fields.push('is_onboarded = ?');
      values.push(data.isOnboarded ? 1 : 0);
    }
    if (data.dietType !== undefined) {
      fields.push('diet_type = ?');
      values.push(data.dietType);
    }
    if (data.allergies !== undefined) {
      fields.push('allergies = ?');
      values.push(JSON.stringify(data.allergies));
    }
    if (data.diseases !== undefined) {
      fields.push('diseases = ?');
      values.push(JSON.stringify(data.diseases));
    }
    if (data.healthGoals !== undefined) {
      fields.push('health_goals = ?');
      values.push(JSON.stringify(data.healthGoals));
    }
    if (data.pushEnabled !== undefined) {
      fields.push('push_enabled = ?');
      values.push(data.pushEnabled ? 1 : 0);
    }
    if (data.emailEnabled !== undefined) {
      fields.push('email_enabled = ?');
      values.push(data.emailEnabled ? 1 : 0);
    }
    if (data.fcmToken !== undefined) {
      fields.push('fcm_token = ?');
      values.push(data.fcmToken);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await this.db
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  }

  // --- KV-based Pending User management (instead of MySQL) ---
  
  async findPendingUserByEmail(email: string): Promise<PendingUser | null> {
    const raw = await this.kv.get(`pending_user:${email}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return new PendingUser(
      parsed.id,
      parsed.email,
      parsed.displayName,
      parsed.passwordHash,
      parsed.otp,
      new Date(parsed.expiresAt)
    );
  }

  async savePendingUser(pendingUser: Omit<PendingUser, 'id'> | PendingUser): Promise<PendingUser> {
    const email = pendingUser.email;
    const id = ('id' in pendingUser) ? pendingUser.id : Math.floor(Math.random() * 1000000);
    
    const entity = new PendingUser(
      id,
      email,
      pendingUser.displayName,
      pendingUser.passwordHash,
      pendingUser.otp,
      pendingUser.expiresAt
    );

    // Calculate expiration in seconds from now (TTL)
    const ttlSeconds = Math.max(
      60,
      Math.floor((new Date(pendingUser.expiresAt).getTime() - Date.now()) / 1000)
    );

    await this.kv.put(`pending_user:${email}`, JSON.stringify(entity), {
      expirationTtl: ttlSeconds
    });

    return entity;
  }

  async deletePendingUser(email: string): Promise<void> {
    await this.kv.delete(`pending_user:${email}`);
  }

  // --- KV-based Password Reset management (instead of MySQL) ---

  async findPasswordResetByEmail(email: string): Promise<PasswordReset | null> {
    const raw = await this.kv.get(`password_reset:${email}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return new PasswordReset(
      parsed.id,
      parsed.email,
      parsed.otp,
      new Date(parsed.expiresAt)
    );
  }

  async savePasswordReset(reset: Omit<PasswordReset, 'id'> | PasswordReset): Promise<PasswordReset> {
    const email = reset.email;
    const id = ('id' in reset) ? reset.id : Math.floor(Math.random() * 1000000);

    const entity = new PasswordReset(
      id,
      email,
      reset.otp,
      reset.expiresAt
    );

    const ttlSeconds = Math.max(
      60,
      Math.floor((new Date(reset.expiresAt).getTime() - Date.now()) / 1000)
    );

    await this.kv.put(`password_reset:${email}`, JSON.stringify(entity), {
      expirationTtl: ttlSeconds
    });

    return entity;
  }

  async deletePasswordReset(email: string): Promise<void> {
    await this.kv.delete(`password_reset:${email}`);
  }

  async findPushEnabledUsers(): Promise<User[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM users WHERE push_enabled = 1 AND fcm_token IS NOT NULL')
      .all();
    return (results || []).map((row: any) => this.mapToUserEntity(row));
  }
}
