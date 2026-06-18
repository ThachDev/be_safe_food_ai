import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IChatRepository } from '../../../domain/repositories/i_chat.repository';
import { IScanRepository } from '../../../domain/repositories/i_scan.repository';
import { IGenerativeAiService } from '../../interfaces/i_generative_ai.service';
import { UserNotFoundError } from '../../../domain/errors/auth.error';

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thành phần sản phẩm, an toàn thực phẩm, dinh dưỡng và chọn lựa nguyên liệu sạch. Hãy tuân thủ nghiêm ngặt các quy tắc sau:

1. VAI TRÒ VÀ PHẠM VI: 
- Bạn là trợ lý ảo chuyên về thực phẩm, dinh dưỡng, mẹo nấu ăn, sức khỏe ăn uống và ý nghĩa của thành phần, phụ gia.
- Luôn thân thiện, chuyên nghiệp và sẵn sàng giúp đỡ.

2. GIAO TIẾP THÔNG THƯỜNG (CHÀO HỎI, CẢM ƠN):
- Nếu người dùng chào hỏi (Hello, Hi, Chào), cảm ơn (Cảm ơn, Thank you), hoặc nói chuyện phiếm lịch sự: Hãy đáp lại thân thiện, ngắn gọn và nhắc nhẹ rằng bạn có thể giúp họ giải đáp về thực phẩm và dinh dưỡng. Không được coi đây là "vấn đề ngoài lề".

3. TỪ CHỐI VẤN ĐỀ NGOÀI LỀ:
- CHỈ TỪ CHỐI khi người dùng yêu cầu kiến thức/công việc không liên quan đến thực phẩm (VD: code, toán học, lịch sử, chính trị...).
- Khi từ chối, dùng đúng mẫu câu sau tùy ngôn ngữ:
  + Tiếng Việt: 'Xin lỗi, tôi là trợ lý ảo chuyên về thực phẩm và dinh dưỡng nên không thể hỗ trợ bạn vấn đề này.'
  + Tiếng Anh: 'Sorry, I am a virtual assistant specializing in food and nutrition, so I cannot help you with this issue.'

4. TÍNH CHÍNH XÁC & KHÁCH QUAN: 
- Giải thích các thuật ngữ hóa học, mã phụ gia (E-numbers) đơn giản, dựa trên khoa học. 
- Không bịa đặt thông tin, không dùng từ ngữ gây hoang mang, phóng đại.

5. CẢNH BÁO Y TẾ: 
- Không đưa ra chỉ định y khoa. 
- Luôn khuyên người dùng thăm khám bác sĩ nếu họ hỏi về bệnh lý, dị ứng, ngộ độc.

6. GIỌNG ĐIỆU & ĐỘ DÀI: 
- Khoa học, trung lập, ngắn gọn và hữu ích.
- Giới hạn câu trả lời trong khoảng 150-200 chữ để tối ưu cho màn hình điện thoại.

7. NGÔN NGỮ & ĐỊNH DẠNG (QUAN TRỌNG):
- Trả lời bằng ngôn ngữ tương ứng với câu hỏi (Tiếng Việt/Tiếng Anh).
- CHỈ dùng văn bản thuần túy (plain text). TUYỆT ĐỐI KHÔNG dùng ký tự markdown như *, _, #.
- Để liệt kê, hãy xuống dòng rõ ràng và dùng dấu gạch ngang (-).`;

@injectable()
export class AnalyzeFoodUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IScanRepository') private scanRepository: IScanRepository,
    @inject('IGenerativeAiService') private aiService: IGenerativeAiService
  ) {}

  async execute(firebaseUid: string, sessionId: string, prompt: string, base64Image?: string, scanHistoryId?: number) {
    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) throw new UserNotFoundError();
    if (!sessionId) throw new Error('sessionId is required');

    let scanContextStr = '';
    if (scanHistoryId) {
      const scan = await this.scanRepository.findByIdAndUserId(scanHistoryId, user.id);
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

    await this.chatRepository.create({
      userId: user.id,
      sessionId: sessionId,
      message: prompt,
      isUser: true
    });

    const finalSystemPrompt = SYSTEM_PROMPT + (scanContextStr ? '\n' + scanContextStr : '');
    let responseText = '';

    try {
      if (base64Image) {
        responseText = await this.aiService.analyzeFoodWithVision(finalSystemPrompt, prompt, base64Image);
      } else {
        responseText = await this.aiService.analyzeTextOnly(finalSystemPrompt, prompt);
      }
    } catch (error: any) {
      console.error('[AnalyzeFoodUseCase] AI Error:', error.message);
      if (base64Image && (error.status === 429 || error.message.includes('rate limit') || error.message.includes('429'))) {
        const fallbackPrompt = `(Ghi chú: Người dùng có đính kèm ảnh nhưng hệ thống xử lý ảnh đang quá tải. Hãy trả lời dựa trên câu hỏi sau)\n\nCâu hỏi: ${prompt}`;
        responseText = await this.aiService.analyzeTextOnly(SYSTEM_PROMPT, fallbackPrompt);
      } else {
        throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
      }
    }

    const aiMessage = await this.chatRepository.create({
      userId: user.id,
      sessionId: sessionId,
      message: responseText,
      isUser: false
    });

    return {
      reply: responseText,
      messageId: aiMessage.id
    };
  }
}
