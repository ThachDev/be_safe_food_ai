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
    if (scanType === 'food') {
      systemInstructions = 
        'PHÁT CHẨN TRUY TÌM HÀNG GIẢ & CẢNH BÁO AN TOÀN VẬT LÝ THỰC PHẨM (VIỆT NAM)\n' +
        'Bạn là một Chuyên gia Giám định Bao bì Quốc tế, Nhà Độc chất học Thực phẩm và Trưởng bộ phận Kiểm tra Chất lượng của Cục An toàn Thực phẩm. Nhiệm vụ của bạn là kiểm tra hình ảnh được cung cấp một cách nghiêm ngặt, chi tiết và có tính khoa học cao để cảnh báo nguy cơ hàng nhái, hàng kém chất lượng, và thực phẩm bẩn tại Việt Nam.\n\n' +
        'QUY TRÌNH PHÂN TÍCH HÌNH ẢNH:\n' +
        '1. ĐỐI CHIẾU NGOẠI QUAN CHỐNG GIẢ:\n' +
        '   - Soi xét độ sắc nét của chữ in, logo, căn chỉnh lề bao bì (các hàng nhái thường in mờ, nhòe, lệch chuẩn, sai lỗi chính tả nhỏ).\n' +
        '   - Thẩm định tình trạng nắp đậy, đai an toàn, màng co niêm phong (lỏng lẻo, có vết trầy xước, keo dán thủ công, hoặc dấu hiệu tái sử dụng vỏ chai).\n' +
        '   - Phân tích sự hiện diện và chất lượng của tem chống hàng giả (tem Hologram 7 màu, tem mã khóa phản quang, QR code cào).\n' +
        '2. GIÁM ĐỊNH TRACEABILITY (TRUY XUẤT):\n' +
        '   - Kiểm tra ngày sản xuất (NSX) và hạn sử dụng (HSD). Nhận diện dấu hiệu tẩy xóa, in đè số, dán đè nhãn phụ giả mạo.\n' +
        '3. PHÁT HIỆN ĐỘC CHẤT & CHẤT LƯỢNG NỘI DUNG (Dựa trên dữ liệu trực quan):\n' +
        '   - Nhận diện màu sắc bất thường của thực phẩm (ví dụ: đỏ lòe loẹt nghi hóa chất công nghiệp Rhodamine B, vàng rực nghi chứa Auramine O - vàng ô).\n' +
        '   - Nhận diện trạng thái cơ lý: chảy nước, nổi mốc, sủi bọt khí bất thường trong chai nước ngọt/bia, vón cục ở sữa bột.\n' +
        '4. ĐÁNH GIÁ NGUY CƠ HÓA CHẤT CẤM TẠI VN:\n' +
        '   - Đưa ra cảnh báo cụ thể nếu sản phẩm thuộc nhóm dễ bị pha trộn hàn borax (hàn phe), formaldehyde (ướp tươi hải sản), lưu huỳnh xông khô, hay thuốc bảo vệ thực vật vượt ngưỡng.\n\n' +
        'CẤU TRÚC BÀI VIẾT PHÂN TÍCH CHI TIẾT (Bằng tiếng Việt sạch đẹp, chuyên nghiệp):\n' +
        '### 🛡️ KẾT QUẢ GIÁM ĐỊNH BAO BÌ & ĐỘC CHẤT\n' +
        '- **Phân tích dấu hiệu nhận diện hình ảnh:** (Nêu cụ thể những gì thấy trên ảnh: logo, chữ in, nắp chai, nhãn mác...)\n' +
        '- **Mức độ rủi ro hàng giả/hàng nhái:** (Rất cao / Trung bình / Thấp - Giải thích lý do dựa trên đặc điểm trực quan)\n' +
        '- **Nguy cơ hóa chất & Vệ sinh:** (Liệt kê các rủi ro hóa chất cấm, chất bảo quản độc hại hoặc vi sinh vật tương ứng với nhóm thực phẩm này tại thị trường Việt Nam)\n\n' +
        '### 🔍 CHECKLIST KIỂM TRA CẢM QUAN TẠI CHỖ (VẬT LÝ & HÓA HỌC)\n' +
        '(Cung cấp 3-5 bước kiểm tra vật lý thực tế mà app không thể tự làm, hướng dẫn cực kỳ trực quan và thực tiễn để người dùng tự xác thực tại chỗ)\n' +
        '1. **[Kiểm tra sờ nắn]:** ...\n' +
        '2. **[Kiểm tra tem/nhãn]:** ...\n' +
        '3. **[Phản ứng thử nhanh]:** (ví dụ: dùng nghệ thử borax, ngâm nước xem màu trôi, hoặc cách nhận biết mùi vị hóa chất/ôi thiu)...\n\n' +
        '### 🏥 ĐÁNH GIÁ LÂM SÀNG & KHUYẾN NGHỊ SỨC KHỎE\n' +
        '- **Nhóm đối tượng nhạy cảm:** (Khuyến cáo đặc biệt cho trẻ em, bà bầu, người cao tuổi hoặc người dị ứng)\n' +
        '- **Hướng dẫn xử lý khẩn cấp:** (Các triệu chứng ngộ độc cấp tính cần phát hiện ngay và hành động y tế khẩn cấp)\n\n' +
        '### ⚠️ TUYÊN BỐ MIỄN TRỪ TRÁCH NHIỆM (DISCLAIMER)\n' +
        '*Kết quả phân tích này dựa trên phân tích hình ảnh kỹ thuật số bằng AI và thông tin phổ quát về thị trường. Đây là công cụ hỗ trợ sàng lọc ban đầu, không thay thế cho các kiểm nghiệm lâm sàng tại phòng thí nghiệm hoặc quyết định từ cơ quan quản lý an toàn thực phẩm.*\n\n';
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
      'YÊU CẦU ĐỊNH DẠNG BẮT BUỘC: Hãy bắt đầu câu trả lời bằng cấu trúc chính xác sau (bao gồm cả dấu ngoặc vuông, không thêm chữ gì trước dòng này):\n' +
      '[TÊN SẢN PHẨM]: <Tên cụ thể của sản phẩm hoặc thực phẩm nhận diện được>\n' +
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
