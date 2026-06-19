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

7. NGÔN NGỮ & ĐỊNH DẠNG:
- Trả lời bằng ngôn ngữ tương ứng với câu hỏi (Tiếng Việt/Tiếng Anh).
- KHUYẾN KHÍCH sử dụng các ký tự Markdown cơ bản để trình bày đẹp mắt hơn trên màn hình điện thoại (in đậm từ khóa quan trọng bằng **, dùng dấu gạch ngang (-) cho danh sách liệt kê, sử dụng các emoji thích hợp). Tránh dùng các thẻ tiêu đề quá to (# hoặc ##).

8. CÁ NHÂN HÓA THEO ĐỐI TƯỢNG (PHÂN TÍCH GIỌNG ĐIỆU CỦA NGƯỜI CHAT):
- Đối với người trẻ tuổi/vị thành niên: Cởi mở, năng động, tập trung vào các thắc mắc về vóc dáng, cân nặng, trị mụn, thể lực học tập.
- Đối với phụ huynh: Đồng cảm, tận tụy, tư vấn kỹ về các chất bảo quản, phẩm màu, dinh dưỡng phát triển của trẻ.
- Đối với người lớn tuổi hoặc có bệnh nền: Từ tốn, kính trọng, nhấn mạnh các chỉ số đường, muối, chất béo xấu liên quan đến bệnh lý của họ.`;

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

    // Build the user health profile context for chat personalization
    const diet = user.dietType || 'Bình thường';
    const allergies = user.allergies || [];
    const diseases = user.diseases || [];
    const goals = user.healthGoals || [];
    
    const profileContextStr = `\n[HỒ SƠ SỨC KHỎE NGƯỜI DÙNG CÁ NHÂN HÓA]:
- Chế độ ăn kiêng: ${diet}
- Chất gây dị ứng của người dùng: ${allergies.length > 0 ? allergies.join(', ') : 'Không dị ứng'}
- Bệnh nền mãn tính: ${diseases.length > 0 ? diseases.join(', ') : 'Không có'}
- Mục tiêu dinh dưỡng: ${goals.length > 0 ? goals.join(', ') : 'Không có'}\n`;

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

        let formattedAiResult = scan.aiResult;
        try {
          const parsedDetails = JSON.parse(scan.aiResult);
          formattedAiResult = `
  + Đánh giá tổng quan: ${parsedDetails.personalEvaluation?.verdict || 'N/A'}
  + Chi tiết theo đối tượng:
    * Da & Vóc dáng: ${parsedDetails.demographicInsights?.skinAndFitness || 'N/A'}
    * Gia đình & Trẻ em: ${parsedDetails.demographicInsights?.familyAndKids || 'N/A'}
    * Bệnh nền: ${parsedDetails.demographicInsights?.chronicDiseases || 'N/A'}
  + Phân tích an toàn:
    * Cảm quan hình ảnh (nếu có): ${parsedDetails.safetyAnalysis?.visualResult || 'N/A'}
    * Lý do đánh giá: ${parsedDetails.safetyAnalysis?.safetyReason || 'N/A'}
    * Hạn dùng/Bảo quản ước lượng: ${parsedDetails.safetyAnalysis?.expiryInfo || 'N/A'}
    * Các chất phụ gia ghi nhận: ${parsedDetails.safetyAnalysis?.additivesDecoded ? JSON.stringify(parsedDetails.safetyAnalysis.additivesDecoded) : 'Không có'}
    * Tổng quan dinh dưỡng: Đường: ${parsedDetails.safetyAnalysis?.nutritionSummary?.sugar || 'N/A'}, Muối: ${parsedDetails.safetyAnalysis?.nutritionSummary?.salt || 'N/A'}, Chất béo xấu: ${parsedDetails.safetyAnalysis?.nutritionSummary?.badFat || 'N/A'}
  + Mẹo hành động:
    * Sơ chế/Bảo quản: ${JSON.stringify(parsedDetails.actionableTips || {})}
`;
        } catch (e) {
          // Fallback to original text if JSON parsing fails
        }
        
        scanContextStr = `\n[BỐI CẢNH QUÉT THỰC PHẨM ĐƯỢC CHỌN VỪA QUA]:
- Tên thực phẩm: ${scan.title}
- Phân loại: ${scan.category}
- Điểm an toàn cá nhân hóa: ${scan.rating}/10 (${scan.scoreText})
- Tóm tắt rủi ro lớn nhất: ${scan.safeLevel}
- Cảnh báo sức khỏe cá nhân: ${warnings}
- Gợi ý sản phẩm thay thế: ${alternatives}
- Kết quả AI phân tích chi tiết: ${formattedAiResult}
Người dùng muốn trò chuyện và hỏi bạn thêm chi tiết hoặc lời khuyên chuyên sâu về thực phẩm vừa được quét ở trên.`;
      }
    }

    // Load recent chat history context for conversational memory
    const chatHistory = await this.chatRepository.findHistory(user.id, sessionId);
    const recentHistory = chatHistory.slice(-8); // Take the last 8 messages to stay within token limits
    let historyStr = '';
    if (recentHistory.length > 0) {
      historyStr = '\n[LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ]:\n' + 
        recentHistory.map(h => `${h.isUser ? 'Người dùng' : 'Trợ lý'}: ${h.message}`).join('\n') + '\n';
    }

    // Save the new user prompt to chat database history
    await this.chatRepository.create({
      userId: user.id,
      sessionId: sessionId,
      message: prompt,
      isUser: true,
      scanHistoryId: scanHistoryId
    });

    const finalSystemPrompt = SYSTEM_PROMPT + profileContextStr + (scanContextStr ? '\n' + scanContextStr : '');
    const promptWithHistory = historyStr 
      ? `${historyStr}\n[CÂU HỎI MỚI NHẤT CỦA NGƯỜI DÙNG]:\n${prompt}`
      : prompt;

    let responseText = '';

    try {
      if (base64Image) {
        responseText = await this.aiService.analyzeFoodWithVision(finalSystemPrompt, promptWithHistory, base64Image);
      } else {
        responseText = await this.aiService.analyzeTextOnly(finalSystemPrompt, promptWithHistory);
      }
    } catch (error: any) {
      console.error('[AnalyzeFoodUseCase] AI Error:', error.message);
      if (base64Image && (error.status === 429 || error.message.includes('rate limit') || error.message.includes('429'))) {
        const fallbackPrompt = `${historyStr}\n(Ghi chú: Người dùng có đính kèm ảnh nhưng hệ thống xử lý ảnh đang quá tải. Hãy trả lời dựa trên câu hỏi sau)\n\nCâu hỏi: ${prompt}`;
        responseText = await this.aiService.analyzeTextOnly(SYSTEM_PROMPT + profileContextStr, fallbackPrompt);
      } else {
        throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
      }
    }

    // Save AI reply to database history
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

