export class ChatMessage {
  constructor(
    public id: number,
    public userId: number,
    public sessionId: string,
    public message: string,
    public isUser: boolean,
    public createdAt?: Date,
    public updatedAt?: Date,
    public scanHistoryId?: number
  ) {}
}

export interface ChatSessionDto {
  sessionId: string;
  lastActivity: Date;
  title: string;
  scanHistoryId?: number;
}
