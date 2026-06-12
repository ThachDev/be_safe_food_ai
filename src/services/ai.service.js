const Groq = require('groq-sdk');

const getGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in backend');
  }
  return new Groq({ apiKey });
};

const GROQ_MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_MODEL_FALLBACK_VISION = 'llama-3.2-11b-vision-preview';

class AIService {
  static async analyzeImage(scanType, base64Image) {
    const groq = getGroq();
    
    let systemInstructions = '';
    if (scanType === 'food_check') {
      systemInstructions = 
        'Phân tích độ tươi ngon, tình trạng thực phẩm và hạn sử dụng\n' +
        'Bạn là một Chuyên gia Vệ sinh An toàn Thực phẩm. Nhiệm vụ của bạn là kiểm tra hình ảnh trực quan để đưa ra cảnh báo an toàn.\n\n' +
        'QUY TẮC SỐ 1: BẮT BUỘC PHÂN BIỆT THỰC PHẨM. Nếu hình ảnh KHÔNG PHẢI LÀ ĐỒ ĂN/THỨC UỐNG (ví dụ: bột giấy, giấy vệ sinh, hóa mỹ phẩm, đồ dùng...), HÃY ĐÁNH GIÁ ĐÂY LÀ "Không phải thực phẩm", KHÔNG ĐƯỢC PHÉP CHẤM ĐIỂM AN TOÀN CHO CHÚNG NHƯ THỰC PHẨM.\n\n' +
        'Quy trình phân tích:\n' +
        '1. Đánh giá chất lượng thực phẩm: Tìm nấm mốc, đốm trắng, héo úa, ôi thiu, biến đổi màu sắc.\n' +
        '2. Kiểm tra hạn sử dụng: Tìm ngày sản xuất/HSD. Suy luận xem sản phẩm còn an toàn không.\n' +
        '3. Đưa ra lời khuyên: Phải mang tính ứng dụng cao, ví dụ cách bảo quản để tươi lâu hơn, cách sơ chế loại bỏ độc tố.';
    } else {
      systemInstructions = 
        'Phân tích thành phần, chất phụ gia & an toàn sinh học\n' +
        'Bạn là Chuyên gia Độc chất học Thực phẩm & Dinh dưỡng Lâm sàng. Hãy quét bao bì và KẾT HỢP VỚI KIẾN THỨC CHUYÊN MÔN CỦA BẠN về loại sản phẩm đó để bóc tách rủi ro sức khỏe.\n\n' +
        'QUY TẮC SỐ 1: NẾU KHÔNG PHẢI THỰC PHẨM (VD: Giấy vệ sinh), HÃY CẢNH BÁO NGAY VÀ KHÔNG PHÂN TÍCH DINH DƯỠNG.\n' +
        'QUY TẮC SỐ 2: TUYỆT ĐỐI KHÔNG TRẢ LỜI "Không rõ" hay "Không có thông tin". Nếu bao bì không ghi định lượng, BẠN PHẢI TỰ DỰ ĐOÁN VÀ ĐÁNH GIÁ DỰA TRÊN BẢN CHẤT CỦA SẢN PHẨM ĐÓ TRÊN THỰC TẾ (Ví dụ: Nhìn thấy "Muối chấm" là phải cảnh báo Natri rất cao; "Mì tôm" là cảnh báo Trans fat; "Nước ngọt" là cảnh báo Đường tự do).\n\n' +
        '1. Định danh phụ gia: Phân tích các E-code hoặc chất hóa học có mặt. Chỉ ra mức độ độc hại.\n' +
        '2. Đánh giá rủi ro dinh dưỡng: Đưa ra nhận định sắc bén về lượng Đường, Muối, Chất béo.\n' +
        '3. Cảnh báo đối tượng: Đưa ra lời khuyên THỰC TẾ, CỤ THỂ cho Trẻ em, Mẹ bầu, Người cao huyết áp/Tiểu đường/Gout. KHÔNG nói chung chung.';
    }

    const prompt = 
      systemInstructions +
      '\n\nYêu cầu định dạng bắt buộc: BẠN BẮT BUỘC PHẢI TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ (TUYỆT ĐỐI KHÔNG TRẢ VỀ MARKDOWN HAY BẤT KỲ VĂN BẢN NÀO KHÁC). Hãy dùng cấu trúc JSON sau:\n' +
      (scanType === 'food_check' ? 
      '{\n' +
      '  "isFood": <true nếu là thực phẩm/đồ uống/bao bì, false nếu là đồ vật lạ>,\n' +
      '  "title": "<Điền tên cụ thể của sản phẩm/thực phẩm. KHÔNG ghi chung chung>",\n' +
      '  "category": "<Gia vị / Sữa / Thực phẩm chức năng / Đồ ăn tươi sống / Đồ uống / Bánh kẹo / Khác>",\n' +
      '  "rating": "<Điểm số an toàn từ 1.0 đến 10.0>",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Cần lưu ý / Nguy hiểm / Không an toàn>",\n' +
      '  "safeLevel": "<Tóm tắt 1 dòng các nguy cơ lớn nhất>",\n' +
      '  "details": {\n' +
      '    "visualResult": "<Mô tả chi tiết những gì thấy trên ảnh>",\n' +
      '    "safetyLevelReason": "<Giải thích lý do cho mức độ an toàn>",\n' +
      '    "expiryInfo": "<Ghi rõ hạn sử dụng nếu đọc được>",\n' +
      '    "recommendations": "<Đưa ra 2-3 lời khuyên thiết thực>"\n' +
      '  }\n' +
      '}' 
      : 
      '{\n' +
      '  "isFood": <true nếu là thực phẩm/đồ uống/bao bì, false nếu là đồ vật lạ>,\n' +
      '  "title": "<Điền tên cụ thể của sản phẩm/thực phẩm. KHÔNG ghi chung chung>",\n' +
      '  "category": "<Gia vị / Sữa / Thực phẩm chức năng / Đồ ăn tươi sống / Đồ uống / Bánh kẹo / Khác>",\n' +
      '  "rating": "<Điểm số an toàn từ 1.0 đến 10.0>",\n' +
      '  "scoreText": "<Tuyệt đối an toàn / An toàn sử dụng / Chứa phụ gia nguy cơ / Không an toàn>",\n' +
      '  "safeLevel": "<Tóm tắt 1 dòng các nguy cơ lớn nhất>",\n' +
      '  "details": {\n' +
      '    "additives": [\n' +
      '      { "code": "<E-Code>", "name": "<Tên Hóa Học>", "function": "<Chức Năng>", "risk": "<Thấp/TB/Cao>", "regulation": "<Quy Định EU/FDA>" }\n' +
      '    ],\n' +
      '    "nutritionWarnings": "<Phân tích mức Đường, Sodium, Trans fat, Chất béo bão hòa>",\n' +
      '    "longTermRisks": "<Tác hại lâu dài (Mãn tính)>",\n' +
      '    "legalDeviations": "<Vênh tiêu chuẩn pháp lý (nếu có)>",\n' +
      '    "sensitiveGroups": {\n' +
      '      "children": "<Rủi ro cho trẻ em>",\n' +
      '      "pregnant": "<Rủi ro cho mẹ bầu & cho con bú>",\n' +
      '      "patients": "<Cảnh báo cho người bệnh nền>"\n' +
      '    }\n' +
      '  }\n' +
      '}');

    try {
      let responseText = '';
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL_VISION,
          messages: [
            { 
              role: 'user', 
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1024,
        });
        responseText = completion.choices[0]?.message?.content ?? '';
      } catch (e) {
        console.warn('[AIService] Llama 4 Scout failed, falling back to Llama 3.2 Vision:', e.message);
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL_FALLBACK_VISION,
          messages: [
            { 
              role: 'user', 
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1024,
        });
        responseText = completion.choices[0]?.message?.content ?? '';
      }

      return responseText;
    } catch (error) {
      console.error('[AIService.analyzeImage] Groq API error:', error);
      throw new Error('Không thể kết nối đến AI dịch vụ phân tích ảnh. Chi tiết: ' + error.message);
    }
  }
}

module.exports = AIService;
