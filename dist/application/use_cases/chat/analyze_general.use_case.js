"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeGeneralUseCase = void 0;
const tsyringe_1 = require("tsyringe");
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
- KHUYẾN KHÍCH sử dụng các ký tự Markdown cơ bản để trình bày đẹp mắt hơn trên màn hình điện thoại (in đậm từ khóa quan trọng bằng **, dùng dấu gạch ngang (-) cho danh sách liệt kê, sử dụng các emoji thích hợp). Tránh dùng các thẻ tiêu đề quá to (# hoặc ##).`;
let AnalyzeGeneralUseCase = class AnalyzeGeneralUseCase {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async execute(prompt, base64Image) {
        if (!prompt) {
            throw new Error('Prompt is required');
        }
        try {
            if (base64Image) {
                return await this.aiService.analyzeFoodWithVision(SYSTEM_PROMPT, prompt, base64Image);
            }
            else {
                return await this.aiService.analyzeTextOnly(SYSTEM_PROMPT, prompt);
            }
        }
        catch (error) {
            throw new Error('Không thể kết nối đến AI hoặc có lỗi xảy ra.');
        }
    }
};
exports.AnalyzeGeneralUseCase = AnalyzeGeneralUseCase;
exports.AnalyzeGeneralUseCase = AnalyzeGeneralUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IGenerativeAiService')),
    __metadata("design:paramtypes", [Object])
], AnalyzeGeneralUseCase);
