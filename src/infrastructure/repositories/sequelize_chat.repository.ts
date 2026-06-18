import { injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/i_chat.repository';
import { ChatMessage, ChatSessionDto } from '../../domain/entities/chat_message.entity';

const SequelizeChatMessage = require('../../models/chat_message.model');
const db = require('../../models');

@injectable()
export class SequelizeChatRepository implements IChatRepository {
  async create(chatMessage: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatMessage> {
    const msg = await SequelizeChatMessage.create({
      userId: chatMessage.userId,
      sessionId: chatMessage.sessionId,
      message: chatMessage.message,
      isUser: chatMessage.isUser
    });
    return new ChatMessage(
      msg.id,
      msg.userId,
      msg.sessionId,
      msg.message,
      msg.isUser,
      msg.createdAt,
      msg.updatedAt
    );
  }

  async findHistory(userId: number, sessionId: string): Promise<ChatMessage[]> {
    const messages = await SequelizeChatMessage.findAll({
      where: { userId, sessionId },
      order: [['createdAt', 'ASC']]
    });
    return messages.map((msg: any) => new ChatMessage(
      msg.id,
      msg.userId,
      msg.sessionId,
      msg.message,
      msg.isUser,
      msg.createdAt,
      msg.updatedAt
    ));
  }

  async findSessions(userId: number): Promise<ChatSessionDto[]> {
    const sessions = await SequelizeChatMessage.findAll({
      attributes: [
        'sessionId',
        [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastActivity']
      ],
      where: { userId },
      group: ['sessionId'],
      order: [[db.sequelize.literal('lastActivity'), 'DESC']],
      raw: true
    });

    const result: ChatSessionDto[] = [];
    for (let session of sessions) {
      const firstMsg = await SequelizeChatMessage.findOne({
        where: { userId, sessionId: session.sessionId, isUser: true },
        order: [['createdAt', 'ASC']],
        attributes: ['message']
      });
      result.push({
        sessionId: session.sessionId,
        lastActivity: session.lastActivity,
        title: firstMsg ? (firstMsg.message.substring(0, 30) + '...') : 'New Chat'
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
