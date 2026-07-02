
import { IUserRepository } from '../../../domain/repositories/i_user.repository';
import { IGenerativeAiService } from '../../interfaces/i_generative_ai.service';
import { ICloudinaryService } from '../../interfaces/i_cloudinary.service';
import { UserNotFoundError } from '../../../domain/errors/auth.error';


export class AnalyzeScanUseCase {
  constructor(
    private userRepository: IUserRepository,
    private aiService: IGenerativeAiService,
    private cloudinaryService: ICloudinaryService
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
        'Bạn là một Chuyên gia Vệ sinh An toàn Thực phẩm kiêm Trợ lý Sức khỏe Cá nhân hóa. Nhiệm vụ của bạn là kiểm tra hình ảnh trực quan kết hợp với ngữ cảnh thực phẩm tươi sống và hồ sơ sức khỏe người dùng để đưa ra đánh giá độ tươi và cảnh báo an toàn cá nhân hóa.\n\n' +
        'QUY TẮC SỐ 1: BẮT BUỘC PHÂN BIỆT THỰC PHẨM. Nếu hình ảnh KHÔNG PHẢI LÀ ĐỒ ĂN/THỨC UỐNG tươi sống hoặc nguyên liệu nấu ăn, hãy đánh giá "isFood" là false.\n\n' +
        'QUY TẮC SỐ 2: KHÔNG ĐOÁN HẠN SỬ DỤNG MÙ QUÁNG. Dựa vào thời gian đã bảo quản, cách bảo quản và dấu hiệu cảm quan (mùi lạ, nhớt, đổi màu) để ước lượng thời gian còn sử dụng được an toàn.\n\n' +
        'QUY TẮC SỐ 3: CÁ NHÂN HÓA ĐA CHIỀU (PHÂN TÍCH THEO ĐỘ TUỔI & MỤC TIÊU SỨC KHỎE):\n' +
        '- Đối với người trẻ/vị thành niên: Phân tích tác động trực diện đến vóc dáng (tăng/giảm mỡ) và da liễu (nguy cơ nổi mụn trứng cá).\n' +
        '- Đối với gia đình/trẻ nhỏ: Đánh giá chất lượng dinh dưỡng, sự phù hợp cho trẻ em/mẹ bầu.\n' +
        '- Đối với người lớn tuổi/người bệnh nền: Cảnh báo sắc bén về tác động tới bệnh mãn tính (ví dụ: người bị gout cần hạn chế thịt bò/hải sản đỏ; người tiểu đường cần cảnh báo về chỉ số đường huyết; người cao huyết áp/thận cần cảnh báo về muối).\n\n' +
        'Quy trình phân tích:\n' +
        '1. Đánh giá cảm quan thực phẩm: Chỉ ra các điểm nghi ngờ hoặc độ tươi ngon từ hình ảnh (vân mỡ, màu sắc thịt/rau, độ căng mọng, nấm mốc, đốm đen).\n' +
        '2. Đối chiếu bệnh lý nền & dị ứng: Cảnh báo cực kỳ nguy hiểm nếu trùng chất gây dị ứng của họ.\n' +
        '3. Đưa ra lời khuyên sơ chế & bảo quản thiết thực: Cách rửa/ngâm loại bỏ chất độc, nhiệt độ bảo quản và nấu chín an toàn.' +
        profileContextStr + 
        freshContextStr;
    } else {
      systemInstructions = 
        'Phân tích thành phần, chất phụ gia & an toàn đóng gói\n' +
        'Bạn là Chuyên gia Độc chất học Thực phẩm & Dinh dưỡng Lâm sàng. Hãy quét bảng thành phần/bao bì sản phẩm đóng gói/nước đóng chai và đối chiếu với hồ sơ sức khỏe người dùng dưới đây để tính toán rủi ro sức khỏe trực tiếp.\n\n' +
        'QUY TẮC SỐ 1: NẾU KHÔNG PHẢI THỰC PHẨM/ĐỒ UỐNG đóng gói (VD: hóa mỹ phẩm, giấy vệ sinh), hãy đặt isFood = false.\n\n' +
        'QUY TẮC SỐ 2: CÁ NHÂN HÓA LÀM TRỌNG TÂM. Đánh giá điểm số an toàn (rating từ 1.0 đến 10.0) dựa trên mức độ phù hợp của sản phẩm đối với hồ sơ bệnh lý, dị ứng và mục tiêu sức khỏe của người dùng, KHÔNG CHỈ DÙNG ĐIỂM CHUNG CHUNG. Nếu có bất kỳ thành phần nào trùng chất dị ứng hoặc làm trầm trọng bệnh lý của người dùng, phải trừ điểm nặng và ghi rõ lý do trong phần cảnh báo.\n\n' +
        'QUY TẮC SỐ 3: GIẢI MÃ PHỤ GIA DỄ HIỂU. Khi phát hiện các E-code hoặc chất phụ gia hóa học, hãy bóc tách chức năng và mô tả tác hại tiềm ẩn bằng từ ngữ bình dân, dễ hiểu nhất cho người dùng phổ thông.\n\n' +
        'QUY TẮC SỐ 4: PHÂN TÍCH ĐA ĐỐI TƯỢNG:\n' +
        '- Người trẻ tuổi/vị thành niên: Đánh giá mụn trứng cá, béo phì, thể lực.\n' +
        '- Phụ huynh/Trẻ nhỏ: Tác hại của chất bảo quản, đường hóa học, phẩm màu nhân tạo tới sự phát triển của trẻ nhỏ.\n' +
        '- Người có bệnh nền: Phân tích kỹ lưỡng các hàm lượng Đường (cho người tiểu đường), Natri/Muối (cho người cao huyết áp/thận), Chất béo bão hòa/Trans fat (cho người mỡ máu/tim mạch).' +
        profileContextStr;
    }

    const prompt = 
      systemInstructions +
      '\n\nYêu cầu định dạng bắt buộc: BẠN BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ (TUYỆT ĐỐI KHÔNG TRẢ VỀ MARKDOWN HAY BẤT KỲ VĂN BẢN NÀO KHÁC). Hãy dùng cấu trúc JSON sau:\n' +
      (scanType === 'food_check' ? 
      '{\n' +
      '  "isFood": <true nếu là thực phẩm/đồ uống tươi sống/nguyên liệu nấu ăn, false nếu là đồ vật khác>,\n' +
      '  "title": "<Tên cụ thể của loại thực phẩm tươi sống>",\n' +
      '  "category": "<Đồ ăn tươi sống / Rau củ quả / Thịt cá / Hải sản / Khác>",\n' +
      '  "rating": "<Điểm số an toàn cá nhân hóa từ 1.0 đến 10.0 dạng chuỗi số, ví dụ \"8.5\">",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Cần lưu ý / Nguy hiểm>",\n' +
      '  "safeLevel": "<Tóm tắt ngắn gọn 1 dòng nhận định lớn nhất về độ tươi hoặc độ an toàn của thực phẩm tươi sống này>",\n' +
      '  "personalWarnings": [\n' +
      '    "<Cảnh báo dị ứng hoặc rủi ro bệnh lý trực tiếp cho người dùng dựa trên hồ sơ sức khỏe của họ. Nếu không có nguy cơ lớn, ghi mảng rỗng []>"\n' +
      '  ],\n' +
      '  "healthyAlternatives": [\n' +
      '    "<Gợi ý 2-3 thực phẩm tươi sống/món ăn khác lành mạnh hơn hoặc cách chế biến an toàn thay thế thích hợp cho hồ sơ sức khỏe người dùng này. Nếu không có ghi []>"\n' +
      '  ],\n' +
      '  "details": {\n' +
      '    "personalEvaluation": {\n' +
      '      "verdict": "<Lời khuyên cốt lõi 1 câu duy nhất dành riêng cho người dùng này dựa trên bệnh nền/dị ứng/mục tiêu của họ>"\n' +
      '    },\n' +
      '    "demographicInsights": {\n' +
      '      "skinAndFitness": "<Đánh giá tác động đến mụn trứng cá, cân nặng, vóc dáng (cho người trẻ)>",\n' +
      '      "familyAndKids": "<Đánh giá mức độ an toàn và phù hợp cho trẻ em/mẹ bầu hoặc sử dụng trong bữa cơm gia đình>",\n' +
      '      "chronicDiseases": "<Phân tích tác động trực tiếp lên bệnh nền của người dùng (Tiểu đường, Cao huyết áp, Gút, v.v.). Nếu không có bệnh nền, hãy phân tích nguy cơ phòng bệnh lâu dài>"\n' +
      '    },\n' +
      '    "safetyAnalysis": {\n' +
      '      "visualResult": "<Mô tả chi tiết độ tươi ngon, màu sắc, tình trạng bề mặt quan sát thấy trên ảnh>",\n' +
      '      "safetyReason": "<Giải thích chi tiết lý do cho mức độ an toàn dựa trên cách bảo quản và cảm quan>",\n' +
      '      "expiryInfo": "<Đánh giá thời gian còn sử dụng được an toàn dựa trên thông tin lưu trữ bảo quản và các dấu hiệu nhận biết hỏng>"\n' +
      '    },\n' +
      '    "actionableTips": {\n' +
      '      "preparation": [\n' +
      '        "<Bước sơ chế hoặc rửa ngâm loại bỏ hóa chất/độc tố thực phẩm hiệu quả nhất>"\n' +
      '      ],\n' +
      '      "storage": [\n' +
      '        "<Lời khuyên bảo quản đúng cách ngăn mát/trữ đông để giữ độ tươi ngon lâu nhất>"\n' +
      '      ]\n' +
      '    }\n' +
      '  }\n' +
      '}' 
      : 
      '{\n' +
      '  "isFood": <true nếu là bao bì thực phẩm/đồ uống đóng hộp/chế phẩm ăn uống đóng gói, false nếu là đồ vật khác>,\n' +
      '  "title": "<Tên thương hiệu và tên sản phẩm cụ thể bóc tách từ bao bì đóng gói>",\n' +
      '  "category": "<Gia vị / Sữa / Thực phẩm chức năng / Đồ uống / Bánh kẹo / Khác>",\n' +
      '  "rating": "<Điểm số an toàn cá nhân hóa từ 1.0 đến 10.0 dạng chuỗi số cho người dùng này, ví dụ \"6.5\">",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Chứa phụ gia nguy cơ / Không an toàn / Nguy hiểm>",\n' +
      '  "safeLevel": "<Tóm tắt ngắn gọn 1 dòng các nguy cơ lớn nhất về thành phần/phụ gia cho sản phẩm đóng gói này>",\n' +
      '  "personalWarnings": [\n' +
      '    "<Cảnh báo chi tiết các thành phần gây dị ứng hoặc gây hại trực tiếp cho bệnh lý của người dùng. Ghi cụ thể chất nào gây hại. Nếu không có rủi ro nào trùng khớp, ghi []>"\n' +
      '  ],\n' +
      '  "healthyAlternatives": [\n' +
      '    "<Gợi ý 2-3 sản phẩm thay thế cùng phân loại có điểm số tốt hơn hoặc lành mạnh hơn cho sức khỏe người dùng này. Nếu không có ghi []>"\n' +
      '  ],\n' +
      '  "details": {\n' +
      '    "personalEvaluation": {\n' +
      '      "verdict": "<Lời khuyên cốt lõi 1 câu duy nhất dành riêng cho người dùng này dựa trên bệnh nền/dị ứng/mục tiêu của họ>"\n' +
      '    },\n' +
      '    "demographicInsights": {\n' +
      '      "skinAndFitness": "<Đánh giá tác động của các chất ngọt, đường hóa học hoặc dầu mỡ đến mụn trứng cá, cân nặng, vóc dáng (cho người trẻ)>",\n' +
      '      "familyAndKids": "<Cảnh báo chất bảo quản, phẩm màu nhân tạo, tác động đến sự phát triển của trẻ nhỏ hoặc mẹ bầu>",\n' +
      '      "chronicDiseases": "<Phân tích tác động trực tiếp của đường, muối, chất béo xấu lên bệnh nền của người dùng (Tiểu đường, Cao huyết áp, Thận, Tim mạch, v.v.). Nếu không có bệnh nền, hãy phân tích phòng bệnh lâu dài>"\n' +
      '    },\n' +
      '    "safetyAnalysis": {\n' +
      '      "additivesDecoded": [\n' +
      '        { "code": "<Tên viết tắt (Mã E-code) - VD: BHA (320)>", "name": "<Tên thông dụng dễ hiểu bằng tiếng Việt>", "purpose": "<Chức năng phụ gia>", "safetyLevel": "<An toàn / Hạn chế/ Nguy hại>", "description": "<Giải thích siêu đơn giản tác hại thực tế bằng tiếng Việt>" }\n' +
      '      ],\n' +
      '      "nutritionSummary": {\n' +
      '        "sugar": "<Mức Đường: Thấp / Trung bình / Cao kèm định lượng ước tính>",\n' +
      '        "salt": "<Mức Muối/Sodium: Thấp / Trung bình / Cao kèm định lượng ước tính>",\n' +
      '        "badFat": "<Mức Chất béo bão hòa/Trans fat: Thấp / Trung bình / Cao kèm định lượng ước tính>"\n' +
      '      }\n' +
      '    },\n' +
      '    "actionableTips": {\n' +
      '      "recommendations": [\n' +
      '        "<Lời khuyên sử dụng thực tế (ví dụ: tần suất ăn uống, kết hợp món ăn khác hoặc lưu ý đặc biệt)>"\n' +
      '      ]\n' +
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
      
      // Construct robust fallback structured details matching schema to prevent Frontend crash
      const fallbackDetails = scanType === 'food_check' ? {
        personalEvaluation: { verdict: 'Không thể phân tích cấu trúc chi tiết từ hình ảnh này.' },
        demographicInsights: { skinAndFitness: 'Không rõ', familyAndKids: 'Không rõ', chronicDiseases: 'Không rõ' },
        safetyAnalysis: { visualResult: 'Hình ảnh không đủ độ rõ nét để đánh giá cảm quan trực quan.', safetyReason: 'Lỗi định dạng dữ liệu phản hồi từ AI', expiryInfo: 'Không xác định' },
        actionableTips: { preparation: [], storage: [] }
      } : {
        personalEvaluation: { verdict: 'Không thể phân tích cấu trúc chi tiết từ hình ảnh này.' },
        demographicInsights: { skinAndFitness: 'Không rõ', familyAndKids: 'Không rõ', chronicDiseases: 'Không rõ' },
        safetyAnalysis: { additivesDecoded: [], nutritionSummary: { sugar: 'Không rõ', salt: 'Không rõ', badFat: 'Không rõ' } },
        actionableTips: { recommendations: [] }
      };
      cleanedResult = JSON.stringify(fallbackDetails);
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
