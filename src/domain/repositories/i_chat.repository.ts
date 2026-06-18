import { ChatMessage, ChatSessionDto } from '../entities/chat/chat_message.entity';

export interface IChatRepository {
  create(chatMessage: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage>;
  findHistory(userId: number, sessionId: string): Promise<ChatMessage[]>;
  findSessions(userId: number): Promise<ChatSessionDto[]>;
  deleteSession(userId: number, sessionId: string): Promise<void>;
}
