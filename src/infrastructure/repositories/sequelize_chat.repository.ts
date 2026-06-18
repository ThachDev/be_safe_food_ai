import { injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/i_chat.repository';
import { ChatMessage, ChatSessionDto } from '../../domain/entities/chat/chat_message.entity';

import SequelizeChatMessage from '../database/sequelize/models/chat/chat_message.model';
import db from '../database/sequelize/models';

@injectable()
export class SequelizeChatRepository implements IChatRepository {
  private mapToEntity(record: any): ChatMessage {
    return new ChatMessage(
      record.id,
      record.userId,
      record.sessionId,
      record.message,
      record.isUser,
      record.createdAt,
      record.updatedAt
    );
  }

  async create(chatMessage: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    const msg = await SequelizeChatMessage.create({
      userId: chatMessage.userId,
      sessionId: chatMessage.sessionId,
      message: chatMessage.message,
      isUser: chatMessage.isUser
    });
    return this.mapToEntity(msg);
  }

  async findHistory(userId: number, sessionId: string): Promise<ChatMessage[]> {
    const messages = await SequelizeChatMessage.findAll({
      where: { userId, sessionId },
      order: [['createdAt', 'ASC']]
    });
    return messages.map((msg: any) => this.mapToEntity(msg));
  }

  async findSessions(userId: number): Promise<ChatSessionDto[]> {
    const sessions: any[] = await SequelizeChatMessage.findAll({
      attributes: [
        'sessionId',
        [db.sequelize.fn('MAX', db.sequelize.col('created_at')), 'lastActivity']
      ],
      where: { userId },
      group: ['sessionId'],
      order: [[db.sequelize.literal('lastActivity'), 'DESC']],
      raw: true
    });

    const result: ChatSessionDto[] = [];
    for (let session of sessions) {
      const firstMsg = await SequelizeChatMessage.findOne({
        where: { userId, sessionId: session.sessionId as string, isUser: true },
        order: [['createdAt', 'ASC']],
        attributes: ['message']
      });
      result.push({
        sessionId: session.sessionId as string,
        lastActivity: session.lastActivity as Date,
        title: firstMsg ? ((firstMsg as any).message.substring(0, 30) + '...') : 'New Chat'
      });
    }
    return result;
  }

  async deleteSession(userId: number, sessionId: string): Promise<void> {
    await SequelizeChatMessage.destroy({
      where: { userId, sessionId }
    });
  }
}
