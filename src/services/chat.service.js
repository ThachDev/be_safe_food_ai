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

// Model constants
const GROQ_MODEL_TEXT = 'llama-3.3-70b-versatile';
const GROQ_MODEL_VISION = 'llama-3.2-11b-vision-preview';

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
  static async analyzeFood(firebaseUid, sessionId, prompt, base64Image = null) {
    try {
      // 1. Look up the MySQL user
      const user = await findUser(firebaseUid);
      if (!user) throw new Error('Người dùng không tồn tại trong hệ thống.');

      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      // 2. Save user's message to DB (Only save text)
      await db.ChatMessage.create({
        userId: user.id,
        sessionId: sessionId,
        message: prompt,
        isUser: true
      });

      // 3. Prepare call Groq AI
      const groq = getGroq();
      let responseText = '';
      
      try {
        if (base64Image) {
          // Vision call
          const completion = await groq.chat.completions.create({
            model: GROQ_MODEL_VISION,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { 
                role: 'user', 
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
              }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          });
          responseText = completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
        } else {
          // Text-only call
          const completion = await groq.chat.completions.create({
            model: GROQ_MODEL_TEXT,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          });
          responseText = completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
        }
      } catch (aiError) {
        // Fallback if Vision model hits rate limit or fails
        if (base64Image && (aiError.status === 429 || aiError.message.includes('rate limit') || aiError.message.includes('429'))) {
          console.warn('[ChatService] Vision model rate limited, falling back to text-only model.');
          const fallbackPrompt = `(Ghi chú: Người dùng có đính kèm ảnh nhưng hệ thống xử lý ảnh đang quá tải. Hãy trả lời dựa trên câu hỏi sau)\n\nCâu hỏi: ${prompt}`;
          
          const completion = await groq.chat.completions.create({
            model: GROQ_MODEL_TEXT,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: fallbackPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1024,
          });
          responseText = completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
        } else {
          // If text model fails or other error, throw it
          throw aiError;
        }
      }

      // 4. Save AI's response to DB
      const aiMessage = await db.ChatMessage.create({
        userId: user.id,
        sessionId: sessionId,
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
        model: GROQ_MODEL_TEXT,
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
   * Get chat history for a specific session
   */
  static async getHistory(firebaseUid, sessionId) {
    const user = await findUser(firebaseUid);
    if (!user || !sessionId) return [];

    return await db.ChatMessage.findAll({
      where: { userId: user.id, sessionId: sessionId },
      order: [['createdAt', 'ASC']]
    });
  }

  /**
   * Get all distinct sessions for a user, grouped/ordered by latest
   */
  static async getSessions(firebaseUid) {
    const user = await findUser(firebaseUid);
    if (!user) return [];

    // Lấy tin nhắn cuối cùng của mỗi session
    const sessions = await db.ChatMessage.findAll({
      attributes: [
        'sessionId',
        [db.sequelize.fn('MAX', db.sequelize.col('createdAt')), 'lastActivity']
      ],
      where: { userId: user.id },
      group: ['sessionId'],
      order: [[db.sequelize.literal('lastActivity'), 'DESC']],
      raw: true
    });

    // Lấy nội dung tin nhắn đầu tiên (để làm title)
    for (let session of sessions) {
      const firstMsg = await db.ChatMessage.findOne({
        where: { userId: user.id, sessionId: session.sessionId, isUser: true },
        order: [['createdAt', 'ASC']],
        attributes: ['message']
      });
      session.title = firstMsg ? (firstMsg.message.substring(0, 30) + '...') : 'New Chat';
    }

    return sessions;
  }
}

module.exports = ChatService;
