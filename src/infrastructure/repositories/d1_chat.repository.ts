import { IChatRepository } from '../../domain/repositories/i_chat.repository';
import { ChatMessage, ChatSessionDto } from '../../domain/entities/chat/chat_message.entity';

export class D1ChatRepository implements IChatRepository {
  constructor(private db: any) {}

  private mapToEntity(row: any): ChatMessage {
    return new ChatMessage(
      row.id,
      row.user_id,
      row.session_id,
      row.message,
      row.is_user === 1,
      row.created_at ? new Date(row.created_at) : undefined,
      row.updated_at ? new Date(row.updated_at) : undefined,
      row.scan_history_id
    );
  }

  async create(chatMessage: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    const result = await this.db
      .prepare(
        `INSERT INTO chat_messages (
          user_id, session_id, message, is_user, scan_history_id
        ) VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        chatMessage.userId,
        chatMessage.sessionId,
        chatMessage.message,
        chatMessage.isUser ? 1 : 0,
        chatMessage.scanHistoryId || null
      )
      .run();

    const lastId = result.meta.last_row_id || 1;
    return new ChatMessage(
      lastId,
      chatMessage.userId,
      chatMessage.sessionId,
      chatMessage.message,
      chatMessage.isUser,
      new Date(),
      new Date(),
      chatMessage.scanHistoryId
    );
  }

  async findHistory(userId: number, sessionId: string): Promise<ChatMessage[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM chat_messages WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC')
      .bind(userId, sessionId)
      .all();
    return (results || []).map((row: any) => this.mapToEntity(row));
  }

  async findSessions(userId: number): Promise<ChatSessionDto[]> {
    const { results } = await this.db
      .prepare(
        `SELECT session_id as sessionId, MAX(created_at) as lastActivity 
         FROM chat_messages 
         WHERE user_id = ? 
         GROUP BY session_id 
         ORDER BY lastActivity DESC`
      )
      .bind(userId)
      .all();

    const result: ChatSessionDto[] = [];
    for (const session of results || []) {
      const firstMsg = await this.db
        .prepare(
          `SELECT message, scan_history_id 
           FROM chat_messages 
           WHERE user_id = ? AND session_id = ? AND is_user = 1 
           ORDER BY created_at ASC 
           LIMIT 1`
        )
        .bind(userId, session.sessionId)
        .first();

      result.push({
        sessionId: session.sessionId,
        lastActivity: new Date(session.lastActivity),
        title: firstMsg ? (firstMsg.message.substring(0, 30) + '...') : 'New Chat',
        scanHistoryId: firstMsg ? firstMsg.scan_history_id : undefined
      });
    }
    return result;
  }

  async deleteSession(userId: number, sessionId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM chat_messages WHERE user_id = ? AND session_id = ?')
      .bind(userId, sessionId)
      .run();
  }
}
