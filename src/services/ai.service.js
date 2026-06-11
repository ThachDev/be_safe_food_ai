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
        'PHÂN TÍCH ĐỘ TƯƠI NGON, TÌNH TRẠNG THỰC PHẨM & ĐỌC HẠN SỬ DỤNG (VIỆT NAM)\n' +
        'Bạn là một Chuyên gia Vệ sinh An toàn Thực phẩm và Đầu bếp Cao cấp. Nhiệm vụ của bạn là kiểm tra hình ảnh trực quan của đồ ăn, thực phẩm hoặc bao bì chứa hạn sử dụng để đưa ra cảnh báo về độ an toàn trước khi sử dụng.\n\n' +
        'QUY TRÌNH PHÂN TÍCH HÌNH ẢNH:\n' +
        '1. ĐÁNH GIÁ ĐỘ TƯƠI NGON & ÔI THIU (Nếu ảnh là đồ ăn):\n' +
        '   - Nhận diện các dấu hiệu nấm mốc, đốm trắng/xanh bất thường trên bề mặt.\n' +
        '   - Phân tích sự biến đổi màu sắc hoặc kết cấu (ví dụ: thịt thâm đen, rau héo úa, hoa quả nẫu hỏng).\n' +
        '2. TÌM & ĐỌC HẠN SỬ DỤNG (Nếu ảnh là bao bì có in NSX/HSD):\n' +
        '   - Trích xuất thông tin ngày sản xuất và hạn sử dụng (nếu tìm thấy).\n' +
        '   - Đánh giá xem sản phẩm còn an toàn để sử dụng hay không dựa trên ngày hiện tại.\n' +
        '3. ĐÁNH GIÁ NGUY CƠ NGỘ ĐỘC:\n' +
        '   - Đưa ra cảnh báo rủi ro về ngộ độc nếu sử dụng thực phẩm trong tình trạng được phân tích.\n\n' +
        'CẤU TRÚC BÀI VIẾT PHÂN TÍCH CHI TIẾT (Bằng tiếng Việt sạch đẹp, chuyên nghiệp):\n' +
        '### 🛡️ KẾT QUẢ ĐÁNH GIÁ TRỰC QUAN & HẠN SỬ DỤNG\n' +
        '- **Tình trạng thực tế:** (Mô tả chi tiết những gì thấy trên ảnh đồ ăn hoặc chữ hạn sử dụng)\n' +
        '- **Mức độ an toàn:** (Rất an toàn / Cần lưu ý / Nguy hiểm - Giải thích lý do)\n' +
        '- **Thông tin HSD/NSX:** (Ghi rõ hạn sử dụng nếu có thể đọc được)\n\n' +
        '### 🔍 KHUYẾN NGHỊ BẢO QUẢN & SỬ DỤNG\n' +
        '(Đưa ra 2-3 lời khuyên thiết thực để bảo quản đúng cách hoặc xử lý nếu đồ ăn có dấu hiệu hỏng)\n\n' +
        '### ⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)\n' +
        '*Kết quả phân tích này dựa trên đánh giá hình ảnh bằng AI. Đây chỉ là thông tin tham khảo, nếu bạn thấy thực phẩm có mùi vị lạ, hãy bỏ ngay lập tức để đảm bảo an toàn.*\n\n';
    } else {
      systemInstructions = 
        'PHÂN TÍCH OCR THÀNH PHẦN, CHẤT PHỤ GIA & AN TOÀN SINH HỌC (TIÊU CHUẨN QUỐC TẾ)\n' +
        'Bạn là một Chuyên gia Độc chất học Thực phẩm, Chuyên gia Dinh dưỡng Lâm sàng cấp cao và Chuyên viên Đánh giá Tiêu chuẩn An toàn của EFSA (Cục An toàn Thực phẩm Châu Âu). Hãy thực hiện quét OCR chuyên sâu bảng thành phần (Ingredients) và thông tin dinh dưỡng trên nhãn ảnh để bóc tách chi tiết các rủi ro sức khỏe cho người tiêu dùng Việt Nam.\n\n' +
        'QUY TRÌNH PHÂN TÍCH BẢNG THÀNH PHẦN:\n' +
        '1. ĐỊNH DANH CHI TIẾT PHỤ GIA & MÃ E-CODE:\n' +
        '   - Truy vết tất cả các mã số phụ gia E-code (ví dụ: E621, E211, E102, E951, E320...) hoặc tên hóa học tương đương.\n' +
        '   - Phân loại rõ chức năng: Chất tạo ngọt nhân tạo, chất bảo quản chống mốc, chất điều vị hóa học, chất tạo màu tổng hợp, chất nhũ hóa.\n' +
        '2. CHỈ RA VÊNH PHÁP LÝ QUỐC TẾ (CRITICAL):\n' +
        '   - So sánh chi tiết chất nào được phép dùng theo Thông tư 24/2019/TT-BYT của Bộ Y tế Việt Nam nhưng bị **CẤM** hoặc **HẠN CHẾ NGHIÊM NGẶT** ở EU (EFSA) hay Mỹ (FDA) (Ví dụ: Titanium Dioxide E171 bị cấm ở EU do lo ngại hủy hoại gen; E102/E110 tăng động ở trẻ em; các chất bảo quản gây rối loạn nội tiết).\n' +
        '3. ĐÁNH GIÁ CHỈ SỐ DINH DƯỠNG XẤU (NUTRITIONAL RED FLAGS):\n' +
        '   - Đường (Sugar): Kiểm tra lượng đường tự do (Free Sugar) > 10g/100g.\n' +
        '   - Muối (Sodium/Natri): Kiểm tra lượng Natri cực đoan > 400mg/100g (nguy cơ tăng huyết áp).\n' +
        '   - Chất béo trans (Trans fat): Kiểm tra sự xuất hiện của dầu hydro hóa một phần (Partially hydrogenated oil).\n' +
        '4. MA TRẬN NHẠY CẢM ĐỐI TƯỢNG (TARGETED WARNINGS):\n' +
        '   - Tác động lên hệ vi sinh đường ruột và hội chứng chuyển hóa.\n' +
        '   - Chỉ rõ rủi ro với Trẻ em, Phụ nữ mang thai, Người tiểu đường, Cao huyết áp, Gút (Gout), suy thận.\n\n' +
        'CẤU TRÚC BÀI VIẾT PHÂN TÍCH CHI TIẾT (Bằng tiếng Việt sạch đẹp, chuyên nghiệp):\n' +
        '### 📊 HỒ SƠ CHẤT PHỤ GIA (ADDITIVE PROFILE)\n' +
        '| Mã Phụ Gia (E-Code) | Tên Hóa Học | Phân Loại & Chức Năng | Độc Tính & Mức Độ Nguy Cơ (Thấp/TB/Cao) | Quy Định EU/FDA | \n' +
        '| --- | --- | --- | --- | --- |\n' +
        '(Lập bảng chi tiết tất cả các phụ gia phát hiện được. Nếu không có phụ gia, nêu rõ thành phần tự nhiên)\n\n' +
        '### ⚡ CẢNH BÁO DINH DƯỠNG & RỦI RO SỨC KHỎE LÂM SÀNG\n' +
        '- **Chỉ số dinh dưỡng nguy hiểm:** (Phân tích mức Đường, Sodium, Trans fat, Chất béo bão hòa có trong nhãn sản phẩm)\n' +
        '- **Tác hại lâu dài (Mãn tính):** (Tác động đến gan, thận, hệ tiêu hóa, kháng insulin, hoặc nguy cơ ung thư tích tụ)\n' +
        '- **Vênh tiêu chuẩn pháp lý:** (Liệt kê rõ các chất trong sản phẩm được phép dùng ở VN nhưng thế giới cấm hoặc hạn chế)\n\n' +
        '### 🤰 MA TRẬN NHẠY CẢM ĐỐI TƯỢNG (SENSITIVITY MATRIX)\n' +
        '- **Trẻ em:** (Rủi ro tăng động ADHD, dị ứng dị ứng da, hen suyễn, chậm phát triển trí tuệ)\n' +
        '- **Mẹ bầu & Cho con bú:** (Nguy cơ ảnh hưởng thai nhi, sẩy thai, dị tật bẩm sinh hoặc cản trước hấp thu sắt/canxi)\n' +
        '- **Người bệnh nền (Tiểu đường, Tim mạch, Gút, Dị ứng):** (Cảnh báo cụ thể với lượng đường, natri, hoặc gluten/sulfite)\n\n' +
        '### ⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)\n' +
        '*Kết quả phân tích này dựa trên phân tích hình ảnh và bảng thành phần dinh dưỡng được in trên nhãn sản phẩm bằng công nghệ AI. Dữ liệu này chỉ mang tính chất tham khảo giáo dục và hỗ trợ phòng ngừa rủi ro dinh dưỡng ban đầu, không thay thế cho các chẩn đoán hoặc chỉ định y khoa từ bác sĩ điều trị.*\n\n';
    }

    const prompt = 
      systemInstructions +
      'YÊU CẦU ĐỊNH DẠNG BẮT BUỘC: Hãy bắt đầu câu trả lời bằng cấu trúc chính xác sau (bao gồm cả dấu ngoặc vuông, TUYỆT ĐỐI KHÔNG THAY ĐỔI CÁC TỪ KHÓA TRONG NGOẶC VUÔNG, KHÔNG thay chữ "TÊN SẢN PHẨM" thành chữ khác):\n' +
      '[TÊN SẢN PHẨM]: <Điền tên cụ thể của sản phẩm hoặc thực phẩm nhận diện được. KHÔNG ghi chung chung là "Sản phẩm">\n' +
      '[DANH MỤC]: <Gia vị / Sữa / Thực phẩm chức năng / Đồ ăn tươi sống / Đồ uống / Bánh kẹo / Khác>\n' +
      '[ĐIỂM SỐ]: <Điểm số từ 1.0 đến 10.0, ví dụ: 8.5>\n' +
      '[ĐÁNH GIÁ]: <Tuyệt đối an toàn / An toàn sử dụng / Nghi ngờ hàng nhái / Chứa phụ gia nguy cơ / Không an toàn>\n' +
      '[TÓM TẮT]: <Tóm tắt ngắn gọn trong 1 dòng các nguy cơ hoặc lưu ý lớn nhất>\n\n' +
      'Sau đó mới viết nội dung phân tích chi tiết đầy đủ bằng Tiếng Việt bên dưới. Hãy trình bày nội dung sạch đẹp, dễ đọc.';

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
