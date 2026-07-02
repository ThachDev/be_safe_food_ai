
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { User } from '../../../domain/entities/user/user.entity';


export class SyncUserUseCase {
  constructor(
    private userRepository: IUserRepository
  ) {}

  async execute(uid: string, email: string, name?: string, picture?: string): Promise<{ user: User; isNew: boolean }> {
    if (!uid || !email) {
      throw new Error('Firebase UID and Email are required for user synchronization.');
    }

    let user = await this.userRepository.findByFirebaseUid(uid);
    let isNew = false;

    if (user) {
      let hasChanges = false;
      if (user.email !== email) {
        user.email = email;
        hasChanges = true;
      }
      if (user.displayName !== name) {
        user.displayName = name || null;
        hasChanges = true;
      }
      if (picture && user.photoUrl !== picture) {
        user.photoUrl = picture;
        hasChanges = true;
      }

      if (hasChanges) {
        await this.userRepository.update(user.id, user);
      }
    } else {
      let userByEmail = await this.userRepository.findByEmail(email);
      if (userByEmail) {
        userByEmail.firebaseUid = uid;
        if (name) userByEmail.displayName = name;
        if (picture) userByEmail.photoUrl = picture;
        
        await this.userRepository.update(userByEmail.id, userByEmail);
        user = userByEmail;
      } else {
        user = await this.userRepository.create({
          firebaseUid: uid,
          email,
          displayName: name || null,
          photoUrl: picture || null,
          isOnboarded: false,
          dietType: 'Bình thường',
          allergies: [],
          diseases: [],
          healthGoals: []
        });
        isNew = true;
      }
    }

    return { user, isNew };
  }
}
