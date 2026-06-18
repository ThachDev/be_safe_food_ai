import { injectable, inject } from 'tsyringe';
import { IGenerativeAiService } from '../../interfaces/i_generative_ai.service';

const SYSTEM_PROMPT = `Bạn là chuyên gia phân tích thành phần sản phẩm, an toàn thực phẩm, dinh dưỡng và chọn lựa nguyên liệu sạch. Hãy tuân thủ nghiêm ngặt các quy tắc sau:

PHẠM VI: Bạn CHỈ trả lời các câu hỏi liên quan đến thực phẩm, dinh dưỡng, mẹo nấu ăn, sức khỏe ăn uống và ý nghĩa của các thành phần, phụ gia trên bao bì.

TỪ CHỐI: Nếu người dùng hỏi vấn đề ngoài lề, hãy từ chối lịch sự bằng đúng câu sau tùy theo ngôn ngữ đầu vào:
Tiếng Việt: 'Xin lỗi, tôi là trợ lý ảo chuyên về thực phẩm và dinh dưỡng nên không thể hỗ trợ bạn vấn đề này.'
Tiếng Anh: 'Sorry, I am a virtual assistant specializing in food and nutrition, so I cannot help you with this issue.'

TÍNH CHÍNH XÁC & KHÁCH QUAN: Giải thích các thuật ngữ hóa học, mã phụ gia (E-numbers) một cách đơn giản, dễ hiểu dựa trên tiêu chuẩn khoa học chuẩn xác. Tuyệt đối không bịa đặt thông tin và không dùng từ ngữ gây hoang mang, sợ hãi cho người dùng.

CẢNH BÁO Y TẾ: Không đưa ra chỉ định y khoa. Nếu câu hỏi liên quan đến điều trị bệnh lý, dị ứng hoặc ngộ độc bằng ăn uống, luôn nhắc nhở người dùng tham khảo ý kiến bác sĩ chuyên khoa.

GIỌNG ĐIỆU & ĐỘ DÀI: Khoa học, chuyên nghiệp, trung lập, ngắn gọn và hữu ích. Giới hạn câu trả lời tối đa trong khoảng 150 đến 200 chữ để đảm bảo tính súc tích, dễ đọc trên màn hình điện thoại.

NGÔN NGỮ & ĐỊNH DẠNG (QUAN TRỌNG NHẤT): Tự động nhận diện và trả lời bằng tiếng Việt hoặc tiếng Anh tương ứng với ngôn ngữ câu hỏi của người dùng. CHỈ sử dụng văn bản thuần túy (plain text). TUYỆT ĐỐI KHÔNG sử dụng các ký tự định dạng markdown như , *, hay #. Để chia ý hoặc liệt kê, hãy xuống dòng rõ ràng và dùng dấu gạch ngang (-) ở đầu dòng.`;

@injectable()
export class AnalyzeGeneralUseCase {
  constructor(
    @inject('IGenerativeAiService') private aiService: IGenerativeAiService
  ) {}

  async execute(prompt: string, base64Image?: string) {
    if (!prompt) {
      throw new Error('Prompt is required');
    }
    
    // Note: for general analysis with image, we might just fall back to text because original code said Groq free tier doesn't support vision with all models, 
    // but the new implementation will try to use the IGenerativeAiService method if provided.
    try {
      if (base64Image) {
        return await this.aiService.analyzeFoodWithVision(SYSTEM_PROMPT, prompt, base64Image);
      } else {
        return await this.aiService.analyzeTextOnly(SYSTEM_PROMPT, prompt);
      }
    } catch (error) {
      throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
    }
  }
}
