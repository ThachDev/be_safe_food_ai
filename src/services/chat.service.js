const Groq = require('groq-sdk');
const db = require('../models');

// Initialize Groq client
const getGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in backend');
  }
  return new Groq({ apiKey });
};

// Model to use (free, fast)
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = 'Bạn là chuyên gia an toàn thực phẩm, dinh dưỡng và chọn lựa nguyên liệu sạch. Hãy trả lời bằng tiếng Việt một cách khoa học, chuyên nghiệp, ngắn gọn và hữu ích.';

/**
 * Find user record by firebaseUid
 */
const findUser = async (firebaseUid) => {
  return await db.User.findOne({ where: { firebaseUid } });
};

class ChatService {
  /**
   * Send message to Groq AI and save conversation to DB
   */
  static async analyzeFood(firebaseUid, prompt) {
    try {
      // 1. Look up the MySQL user
      const user = await findUser(firebaseUid);
      if (!user) throw new Error('Người dùng không tồn tại trong hệ thống.');

      // 2. Save user's message to DB
      await db.ChatMessage.create({
        userId: user.id,
        message: prompt,
        isUser: true
      });

      // 3. Call Groq AI
      const groq = getGroq();
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      const responseText = completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';

      // 4. Save AI's response to DB
      const aiMessage = await db.ChatMessage.create({
        userId: user.id,
        message: responseText,
        isUser: false
      });

      return {
        reply: responseText,
        messageId: aiMessage.id
      };
    } catch (error) {
      console.error('[ChatService] analyzeFood error:', error.message);
      throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
    }
  }

  /**
   * Run general AI analysis (Anti-Fake, Additives) — no DB save
   */
  static async analyzeGeneral(prompt, base64Image = null) {
    try {
      const groq = getGroq();

      // Note: Groq free tier doesn't support vision with all models
      // For image analysis, we describe what to do with the text prompt
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ];

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      return completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
    } catch (error) {
      console.error('[ChatService] analyzeGeneral error:', error.message);
      throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
    }
  }

  /**
   * Get chat history for a specific user
   */
  static async getHistory(firebaseUid) {
    const user = await findUser(firebaseUid);
    if (!user) return [];

    return await db.ChatMessage.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'ASC']]
    });
  }
}

module.exports = ChatService;
