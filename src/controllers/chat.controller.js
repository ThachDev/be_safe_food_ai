const ChatService = require('../services/chat.service');

class ChatController {
  /**
   * Handle sending a prompt to Gemini (chat with history)
   */
  static async analyze(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const { sessionId, prompt, base64Image, scanHistoryId } = req.body;

      if (!sessionId || !prompt) {
        return res.status(400).json({ status: 'error', message: 'Prompt and sessionId are required' });
      }

      const result = await ChatService.analyzeFood(firebaseUid, sessionId, prompt, base64Image || null, scanHistoryId || null);
      return res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      console.error('ChatController error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
  }

  /**
   * Handle general AI analysis (Anti-Fake, Additives, no DB save)
   */
  static async analyzeGeneral(req, res) {
    try {
      const { prompt, base64Image } = req.body;

      if (!prompt) {
        return res.status(400).json({ status: 'error', message: 'Prompt is required' });
      }

      const reply = await ChatService.analyzeGeneral(prompt, base64Image || null);
      return res.status(200).json({ status: 'success', data: { reply } });
    } catch (error) {
      console.error('ChatController analyzeGeneral error:', error);
      return res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
    }
  }

  /**
   * Retrieve chat history
   */
  static async getHistory(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const sessionId = req.query.sessionId;
      if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
      }
      
      const history = await ChatService.getHistory(firebaseUid, sessionId);
      return res.status(200).json({ status: 'success', data: history });
    } catch (error) {
      console.error('ChatController getHistory error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not fetch history' });
    }
  }

  /**
   * Retrieve all chat sessions
   */
  static async getSessions(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const sessions = await ChatService.getSessions(firebaseUid);
      return res.status(200).json({ status: 'success', data: sessions });
    } catch (error) {
      console.error('ChatController getSessions error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not fetch sessions' });
    }
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(req, res) {
    try {
      const firebaseUid = req.user.uid;
      const sessionId = req.params.sessionId;
      if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
      }

      await ChatService.deleteSession(firebaseUid, sessionId);
      return res.status(200).json({ status: 'success', message: 'Session deleted' });
    } catch (error) {
      console.error('ChatController deleteSession error:', error);
      return res.status(500).json({ status: 'error', message: 'Could not delete session' });
    }
  }
}

module.exports = ChatController;
