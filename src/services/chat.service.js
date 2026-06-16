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
const GROQ_MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thành phần sản phẩm, an toàn thực phẩm, dinh dưỡng và chọn lựa nguyên liệu sạch. Hãy tuân thủ nghiêm ngặt các quy tắc sau:

PHẠM VI: Bạn CHỈ trả lời các câu hỏi liên quan đến thực phẩm, dinh dưỡng, mẹo nấu ăn, sức khỏe ăn uống và ý nghĩa của các thành phần, phụ gia trên bao bì.

TỪ CHỐI: Nếu người dùng hỏi vấn đề ngoài lề, hãy từ chối lịch sự bằng đúng câu sau tùy theo ngôn ngữ đầu vào:
Tiếng Việt: 'Xin lỗi, tôi là trợ lý ảo chuyên về thực phẩm và dinh dưỡng nên không thể hỗ trợ bạn vấn đề này.'
Tiếng Anh: 'Sorry, I am a virtual assistant specializing in food and nutrition, so I cannot help you with this issue.'

TÍNH CHÍNH XÁC & KHÁCH QUAN: Giải thích các thuật ngữ hóa học, mã phụ gia (E-numbers) một cách đơn giản, dễ hiểu dựa trên tiêu chuẩn khoa học chuẩn xác. Tuyệt đối không bịa đặt thông tin và không dùng từ ngữ gây hoang mang, sợ hãi cho người dùng.

CẢNH BÁO Y TẾ: Không đưa ra chỉ định y khoa. Nếu câu hỏi liên quan đến điều trị bệnh lý, dị ứng hoặc ngộ độc bằng ăn uống, luôn nhắc nhở người dùng tham khảo ý kiến bác sĩ chuyên khoa.

GIỌNG ĐIỆU & ĐỘ DÀI: Khoa học, chuyên nghiệp, trung lập, ngắn gọn và hữu ích. Giới hạn câu trả lời tối đa trong khoảng 150 đến 200 chữ để đảm bảo tính súc tích, dễ đọc trên màn hình điện thoại.

NGÔN NGỮ & ĐỊNH DẠNG (QUAN TRỌNG NHẤT): Tự động nhận diện và trả lời bằng tiếng Việt hoặc tiếng Anh tương ứng với ngôn ngữ câu hỏi của người dùng. CHỈ sử dụng văn bản thuần túy (plain text). TUYỆT ĐỐI KHÔNG sử dụng các ký tự định dạng markdown như , *, hay #. Để chia ý hoặc liệt kê, hãy xuống dòng rõ ràng và dùng dấu gạch ngang (-) ở đầu dòng.`;

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
  static async analyzeFood(firebaseUid, sessionId, prompt, base64Image = null, scanHistoryId = null) {
    try {
      // 1. Look up the MySQL user
      const user = await findUser(firebaseUid);
      if (!user) throw new Error('Người dùng không tồn tại trong hệ thống.');

      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      // Query scan context if scanHistoryId is provided
      let scanContextStr = '';
      if (scanHistoryId) {
        const scan = await db.ScanHistory.findOne({ where: { id: scanHistoryId, userId: user.id } });
        if (scan) {
          const warnings = scan.personalWarnings && scan.personalWarnings.length > 0 
            ? scan.personalWarnings.join(', ') 
            : 'Không có';
          const alternatives = scan.healthyAlternatives && scan.healthyAlternatives.length > 0 
            ? scan.healthyAlternatives.join(', ') 
            : 'Không có';
          
          scanContextStr = `\n[BỐI CẢNH QUÉT THỰC PHẨM ĐƯỢC CHỌN]:
- Tên thực phẩm: ${scan.title}
- Phân loại: ${scan.category}
- Điểm an toàn cá nhân hóa: ${scan.rating}/10 (${scan.scoreText})
- Tóm tắt rủi ro lớn nhất: ${scan.safeLevel}
- Cảnh báo sức khỏe cá nhân: ${warnings}
- Gợi ý sản phẩm thay thế: ${alternatives}
- Kết quả AI chi tiết trước đó: ${scan.aiResult}
Người dùng muốn trò chuyện và hỏi bạn thêm chi tiết hoặc lời khuyên chuyên sâu về thực phẩm vừa được quét ở trên.`;
        }
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
      const finalSystemPrompt = SYSTEM_PROMPT + (scanContextStr ? '\n' + scanContextStr : '');
      
      try {
        if (base64Image) {
          // Vision call
          const completion = await groq.chat.completions.create({
            model: GROQ_MODEL_VISION,
            messages: [
              { role: 'system', content: finalSystemPrompt },
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
              { role: 'system', content: finalSystemPrompt },
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
        [db.sequelize.fn('MAX', db.sequelize.col('created_at')), 'lastActivity']
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

  /**
   * Delete a chat session and all its messages
   */
  static async deleteSession(firebaseUid, sessionId) {
    const user = await findUser(firebaseUid);
    if (!user || !sessionId) throw new Error('User or session not found');

    return await db.ChatMessage.destroy({
      where: { userId: user.id, sessionId: sessionId }
    });
  }
}

module.exports = ChatService;
