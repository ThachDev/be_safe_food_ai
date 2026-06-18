import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IChatRepository } from '../../../domain/repositories/i_chat.repository';

@injectable()
export class GetChatHistoryUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string, sessionId: string) {
    if (!sessionId) throw new Error('sessionId is required');
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) return [];
    
    return await this.chatRepository.findHistory(user.id, sessionId);
  }
}

@injectable()
export class GetChatSessionsUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string) {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) return [];
    
    return await this.chatRepository.findSessions(user.id);
  }
}

@injectable()
export class DeleteChatSessionUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string, sessionId: string) {
    if (!sessionId) throw new Error('sessionId is required');
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new Error('User not found');
    
    await this.chatRepository.deleteSession(user.id, sessionId);
  }
}
