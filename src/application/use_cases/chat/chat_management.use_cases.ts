
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IChatRepository } from '../../../domain/repositories/i_chat.repository';


export class GetChatHistoryUseCase {
  constructor(
    private userRepository: IUserRepository,
    private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string, sessionId: string) {
    if (!sessionId) throw new Error('sessionId is required');
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) return [];
    
    return await this.chatRepository.findHistory(user.id, sessionId);
  }
}


export class GetChatSessionsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string) {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) return [];
    
    return await this.chatRepository.findSessions(user.id);
  }
}


export class DeleteChatSessionUseCase {
  constructor(
    private userRepository: IUserRepository,
    private chatRepository: IChatRepository
  ) {}

  async execute(firebaseUid: string, sessionId: string) {
    if (!sessionId) throw new Error('sessionId is required');
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new Error('User not found');
    
    await this.chatRepository.deleteSession(user.id, sessionId);
  }
}
