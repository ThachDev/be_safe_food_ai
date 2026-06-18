import { injectable, inject } from 'tsyringe';
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IGenerativeAiService } from '../../interfaces/i_generative_ai.service';
import { ICloudinaryService } from '../../interfaces/i_cloudinary.service';
import { UserNotFoundError } from '../../../domain/errors/auth.error';

@injectable()
export class AnalyzeScanUseCase {
  constructor(
    @inject('IUserRepository') private userRepository: IUserRepository,
    @inject('IGenerativeAiService') private aiService: IGenerativeAiService,
    @inject('ICloudinaryService') private cloudinaryService: ICloudinaryService
  ) {}

  async execute(firebaseUid: string, scanType: string, base64Image: string, additionalContext?: any) {
    if (!scanType || !base64Image) {
      throw new Error('scanType and base64Image are required');
    }

    const user = await this.userRepository.findByFirebaseUid(firebaseUid);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Build the profile context
    let profileContextStr = '';
    const diet = user.dietType || 'Bình thường';
    const allergies = user.allergies || [];
    const diseases = user.diseases || [];
    const goals = user.healthGoals || [];
    
    profileContextStr = `\n[HỒ SƠ SỨC KHỎE NGƯỜI DÙNG CÁ NHÂN HÓA]:
- Chế độ ăn kiêng: ${diet}
- Chất gây dị ứng của người dùng: ${allergies.length > 0 ? allergies.join(', ') : 'Không dị ứng'}
- Bệnh nền mãn tính: ${diseases.length > 0 ? diseases.join(', ') : 'Không có'}
- Mục tiêu dinh dưỡng: ${goals.length > 0 ? goals.join(', ') : 'Không có'}\n`;

    let systemInstructions = '';
    if (scanType === 'food_check') {
      let freshContextStr = '';
      if (additionalContext) {
        const origin = additionalContext.origin || 'Không rõ';
        const storageTime = additionalContext.storageTime || 'Không rõ';
        const storageMethod = additionalContext.storageMethod || 'Không rõ';
        const physicalSigns = additionalContext.physicalSigns || 'Bình thường';
        
        freshContextStr = `\n[NGỮ CẢNH THỰC PHẨM TƯƠI SỐNG DO NGƯỜI DÙNG CUNG CẤP]:
- Nguồn gốc mua: ${origin}
- Thời gian đã bảo quản: ${storageTime}
- Cách thức bảo quản: ${storageMethod}
- Dấu hiệu cảm quan ghi nhận: ${physicalSigns}\n`;
      }

      systemInstructions = 
        'Phân tích độ tươi ngon, tình trạng thực phẩm tươi sống & an toàn vệ sinh\n' +
        'Bạn là một Chuyên gia Vệ sinh An toàn Thực phẩm. Nhiệm vụ của bạn là kiểm tra hình ảnh trực quan kết hợp với ngữ cảnh thực phẩm tươi sống được cung cấp để đưa ra đánh giá độ tươi và cảnh báo an toàn cá nhân hóa.\n\n' +
        'QUY TẮC SỐ 1: BẮT BUỘC PHÂN BIỆT THỰC PHẨM. Nếu hình ảnh KHÔNG PHẢI LÀ ĐỒ ĂN/THỨC UỐNG, hãy đánh giá "isFood" là false.\n\n' +
        'QUY TẮC SỐ 2: KHÔNG ĐOÁN HẠN SỬ DỤNG MÙ QUÁNG. Đối với đồ ăn tươi sống không có nhãn mác, hãy dựa vào thời gian đã bảo quản, cách bảo quản và dấu hiệu cảm quan (mùi lạ, nhớt, đổi màu) để ước lượng xem thực phẩm còn an toàn để chế biến hay không.\n\n' +
        'Quy trình phân tích:\n' +
        '1. Đánh giá cảm quan thực phẩm: Chỉ ra các điểm nghi ngờ hoặc chứng minh độ tươi ngon từ hình ảnh (ví dụ: vân mỡ, màu sắc thịt/rau, độ căng mọng, nấm mốc, đốm đen).\n' +
        '2. Đối chiếu bệnh lý nền & dị ứng: Cảnh báo nếu loại thực phẩm tươi sống này không phù hợp với người dùng (ví dụ: người bị gout cần hạn chế thịt bò/hải sản đỏ; người dị ứng hải sản cần cảnh báo cực kỳ nguy hiểm nếu ảnh là tôm/cua).\n' +
        '3. Đưa ra lời khuyên sơ chế & bảo quản thiết thực: Cách rửa/ngâm loại bỏ chất độc, nhiệt độ bảo quản và cách nấu chín an toàn để bảo vệ sức khỏe.' +
        profileContextStr + 
        freshContextStr;
    } else {
      systemInstructions = 
        'Phân tích thành phần, chất phụ gia & an toàn sinh học\n' +
        'Bạn là Chuyên gia Độc chất học Thực phẩm & Dinh dưỡng Lâm sàng. Hãy quét bảng thành phần/bao bì sản phẩm và đối chiếu với hồ sơ sức khỏe người dùng dưới đây để tính toán rủi ro sức khỏe trực tiếp.\n\n' +
        'QUY TẮC SỐ 1: NẾU KHÔNG PHẢI THỰC PHẨM (VD: hóa mỹ phẩm, giấy vệ sinh), hãy cảnh báo và đặt isFood = false.\n\n' +
        'QUY TẮC SỐ 2: CÁ NHÂN HÓA LÀM TRỌNG TÂM. Đánh giá điểm số an toàn (rating từ 1.0 đến 10.0) dựa trên mức độ phù hợp của sản phẩm đối với hồ sơ bệnh lý, dị ứng và mục tiêu sức khỏe của người dùng, KHÔNG CHỈ DÙNG ĐIỂM CHUNG CHUNG. Nếu có bất kỳ thành phần nào trùng chất dị ứng hoặc làm trầm trọng bệnh lý của người dùng, phải trừ điểm nặng và ghi rõ lý do trong phần cảnh báo.\n\n' +
        '1. Định danh phụ gia: Chỉ ra các E-code hoặc chất hóa học có mặt, mức độ độc hại của chúng.\n' +
        '2. Cảnh báo đối tượng: Đưa ra cảnh báo sắc bén về lượng Đường, Muối, Chất béo có hại trực tiếp tới bệnh lý nền của người dùng (ví dụ: lượng Sodium cao đối với người bệnh thận/cao huyết áp; Đường cao đối với người tiểu đường).' +
        profileContextStr;
    }

    const prompt = 
      systemInstructions +
      '\n\nYêu cầu định dạng bắt buộc: BẠN BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ (TUYỆT ĐỐI KHÔNG TRẢ VỀ MARKDOWN HAY BẤT KỲ VĂN BẢN NÀO KHÁC). Hãy dùng cấu trúc JSON sau:\n' +
      (scanType === 'food_check' ? 
      '{\n' +
      '  "isFood": <true nếu là thực phẩm/đồ uống/đồ ăn tươi sống, false nếu là đồ vật khác>,\n' +
      '  "title": "<Tên cụ thể của loại thực phẩm tươi sống>",\n' +
      '  "category": "<Đồ ăn tươi sống / Rau củ quả / Thịt cá / Khác>",\n' +
      '  "rating": "<Điểm số an toàn cá nhân hóa từ 1.0 đến 10.0>",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Cần lưu ý / Nguy hiểm>",\n' +
      '  "safeLevel": "<Tóm tắt 1 dòng các nguy cơ lớn nhất hoặc nhận định độ tươi>",\n' +
      '  "personalWarnings": [\n' +
      '    "<Cảnh báo dị ứng hoặc rủi ro bệnh lý trực tiếp cho người dùng dựa trên hồ sơ sức khỏe của họ. Nếu không có, ghi mảng rỗng []>"\n' +
      '  ],\n' +
      '  "healthyAlternatives": [\n' +
      '    "<Gợi ý 2-3 loại thực phẩm tươi sống khác lành mạnh hơn hoặc cách chế biến an toàn thay thế. Ví dụ: thay thịt bò bằng ức gà đối với người bị gout. Nếu không có ghi []>"\n' +
      '  ],\n' +
      '  "details": {\n' +
      '    "visualResult": "<Mô tả chi tiết độ tươi ngon, màu sắc, tình trạng bề mặt quan sát thấy trên ảnh>",\n' +
      '    "safetyLevelReason": "<Giải thích lý do cho mức độ an toàn dựa trên cách bảo quản và cảm quan>",\n' +
      '    "expiryInfo": "<Đánh giá thời gian còn sử dụng được an toàn dựa trên thông tin lưu trữ bảo quản>",\n' +
      '    "recommendations": "<Đưa ra 2-3 lời khuyên sơ chế/rửa sạch và bảo quản thiết thực nhất>"\n' +
      '  }\n' +
      '}' 
      : 
      '{\n' +
      '  "isFood": <true nếu là bao bì thực phẩm/đồ uống/chế phẩm ăn uống, false nếu là đồ vật khác>,\n' +
      '  "title": "<Tên thương hiệu và tên sản phẩm cụ thể bóc tách từ bao bì>",\n' +
      '  "category": "<Gia vị / Sữa / Thực phẩm chức năng / Đồ uống / Bánh kẹo / Khác>",\n' +
      '  "rating": "<Điểm số an toàn cá nhân hóa từ 1.0 đến 10.0 cho người dùng này>",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Chứa phụ gia nguy cơ / Không an toàn>",\n' +
      '  "safeLevel": "<Tóm tắt 1 dòng các nguy cơ lớn nhất về thành phần/phụ gia>",\n' +
      '  "personalWarnings": [\n' +
      '    "<Cảnh báo chi tiết các thành phần gây dị ứng hoặc gây hại cho bệnh lý của người dùng. Ghi cụ thể chất nào gây hại. Nếu không có rủi ro nào trùng khớp, ghi []>"\n' +
      '  ],\n' +
      '  "healthyAlternatives": [\n' +
      '    "<Gợi ý 2-3 sản phẩm thay thế cùng phân loại có điểm số tốt hơn hoặc lành mạnh hơn cho sức khỏe người dùng này. Nếu không có ghi []>"\n' +
      '  ],\n' +
      '  "details": {\n' +
      '    "additives": [\n' +
      '      { "code": "<E-Code>", "name": "<Tên Hóa Học>", "function": "<Chức Năng>", "risk": "<Thấp/TB/Cao>", "regulation": "<Quy Định EU/FDA>" }\n' +
      '    ],\n' +
      '    "nutritionWarnings": "<Phân tích mức Đường, Sodium, Trans fat, Chất béo bão hòa đối chiếu trực tiếp với người dùng>",\n' +
      '    "longTermRisks": "<Tác hại lâu dài mãn tính của sản phẩm>",\n' +
      '    "legalDeviations": "<Vênh tiêu chuẩn pháp lý (nếu có)>",\n' +
      '    "sensitiveGroups": {\n' +
      '      "children": "<Rủi ro cho trẻ em>",\n' +
      '      "pregnant": "<Rủi ro cho mẹ bầu & cho con bú>",\n' +
      '      "patients": "<Cảnh báo chung cho người bệnh nền>"\n' +
      '    }\n' +
      '  }\n' +
      '}');

    const [aiResult, uploadedImageUrl] = await Promise.all([
      this.aiService.analyzeVisionWithJsonFormat(prompt, base64Image),
      this.cloudinaryService.uploadImage(base64Image)
    ]);

    let title = 'Sản phẩm';
    let category = 'Thực phẩm';
    let rating = '7.5';
    let scoreText = 'Cần lưu ý';
    let safeLevel = 'Chưa xác định';
    let personalWarnings: string[] = [];
    let healthyAlternatives: string[] = [];
    let cleanedResult = aiResult;

    try {
      const parsed = JSON.parse(aiResult);
      if (parsed.isFood === false) {
        throw new Error('NOT_FOOD');
      }

      title = parsed.title || title;
      category = parsed.category || category;
      rating = parsed.rating || rating;
      scoreText = parsed.scoreText || scoreText;
      safeLevel = parsed.safeLevel || safeLevel;
      personalWarnings = parsed.personalWarnings || [];
      healthyAlternatives = parsed.healthyAlternatives || [];
      
      if (parsed.details) {
        cleanedResult = JSON.stringify(parsed.details);
      }
    } catch (parseError: any) {
      if (parseError.message === 'NOT_FOOD') {
        throw new Error('Hình ảnh này dường như không phải là thực phẩm hoặc bao bì. Vui lòng chụp lại.');
      }
      console.warn('[AnalyzeScanUseCase] Could not parse AI result as JSON. Using fallback.', parseError);
      cleanedResult = aiResult;
    }

    return {
      title,
      category,
      rating,
      scoreText,
      safeLevel,
      personalWarnings,
      healthyAlternatives,
      aiResult: cleanedResult || aiResult,
      imageUrl: uploadedImageUrl
    };
  }
}
