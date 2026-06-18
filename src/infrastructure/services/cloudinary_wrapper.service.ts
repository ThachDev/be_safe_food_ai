import { injectable } from 'tsyringe';
import { ICloudinaryService } from '../../application/interfaces/i_cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@injectable()
export class CloudinaryWrapperService implements ICloudinaryService {
  async uploadImage(base64String: string, folder: string = 'scans'): Promise<string | null> {
    if (!base64String) return null;
    
    let imageStr = base64String;
    if (!imageStr.startsWith('data:image')) {
      imageStr = `data:image/jpeg;base64,${base64String}`;
    }

    try {
      const result = await cloudinary.uploader.upload(imageStr, {
        folder: folder,
        transformation: [
          { width: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" }
        ]
      });
      return result.secure_url;
    } catch (error) {
      console.error('[CloudinaryService.uploadImage] Error:', error);
      return null;
    }
  }
}
