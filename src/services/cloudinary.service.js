const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  /**
   * Upload base64 image to Cloudinary
   * @param {string} base64String 
   * @param {string} folder 
   * @returns {Promise<string>} secure_url
   */
  static async uploadImage(base64String, folder = 'scans') {
    if (!base64String) return null;
    
    // Ensure base64 string has the correct prefix
    let imageStr = base64String;
    if (!imageStr.startsWith('data:image')) {
      // Assuming jpeg if no prefix, since mobile app sends raw base64
      imageStr = `data:image/jpeg;base64,${base64String}`;
    }

    try {
      const result = await cloudinary.uploader.upload(imageStr, {
        folder: folder,
        // Tự động nén và resize để tiết kiệm dung lượng RẤT NHIỀU
        transformation: [
          { width: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" }
        ]
      });
      return result.secure_url;
    } catch (error) {
      console.error('[CloudinaryService.uploadImage] Error:', error);
      // Không throw error để AI vẫn chạy bình thường kể cả khi upload ảnh thất bại
      return null;
    }
  }
}

module.exports = CloudinaryService;
