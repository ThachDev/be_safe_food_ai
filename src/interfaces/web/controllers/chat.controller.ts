import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { AnalyzeFoodUseCase } from '../../../application/use_cases/chat/analyze_food.use_case';
import { AnalyzeGeneralUseCase } from '../../../application/use_cases/chat/analyze_general.use_case';
import { 
  GetChatHistoryUseCase, 
  GetChatSessionsUseCase, 
  DeleteChatSessionUseCase 
} from '../../../application/use_cases/chat/chat_management.use_cases';

@injectable()
export class ChatController {
  constructor(
    @inject(AnalyzeFoodUseCase) private analyzeFoodUseCase: AnalyzeFoodUseCase,
    @inject(AnalyzeGeneralUseCase) private analyzeGeneralUseCase: AnalyzeGeneralUseCase,
    @inject(GetChatHistoryUseCase) private getChatHistoryUseCase: GetChatHistoryUseCase,
    @inject(GetChatSessionsUseCase) private getChatSessionsUseCase: GetChatSessionsUseCase,
    @inject(DeleteChatSessionUseCase) private deleteChatSessionUseCase: DeleteChatSessionUseCase
  ) {}

  analyze = async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const { sessionId, prompt, base64Image, scanHistoryId } = req.body;

      if (!sessionId || !prompt) {
        return res.status(400).json({ status: 'error', message: 'Prompt and sessionId are required' });
      }

      const result = await this.analyzeFoodUseCase.execute(firebaseUid, sessionId, prompt, base64Image, scanHistoryId);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      console.error('ChatController analyze error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
  };

  analyzeGeneral = async (req: Request, res: Response) => {
    try {
      const { prompt, base64Image } = req.body;

      if (!prompt) {
        return res.status(400).json({ status: 'error', message: 'Prompt is required' });
      }

      const reply = await this.analyzeGeneralUseCase.execute(prompt, base64Image);
      return res.status(200).json({ status: 'success', data: { reply } });
    } catch (error: any) {
      console.error('ChatController analyzeGeneral error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
  };

  getHistory = async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
      }
      
      const history = await this.getChatHistoryUseCase.execute(firebaseUid, sessionId);
      return res.status(200).json({ status: 'success', data: history });
    } catch (error: any) {
      console.error('ChatController getHistory error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not fetch history' });
    }
  };

  getSessions = async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const sessions = await this.getChatSessionsUseCase.execute(firebaseUid);
      return res.status(200).json({ status: 'success', data: sessions });
    } catch (error: any) {
      console.error('ChatController getSessions error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not fetch sessions' });
    }
  };

  deleteSession = async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const sessionId = req.params.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
      }

      await this.deleteChatSessionUseCase.execute(firebaseUid, sessionId);
      return res.status(200).json({ status: 'success', message: 'Session deleted' });
    } catch (error: any) {
      console.error('ChatController deleteSession error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not delete session' });
    }
  };
}
