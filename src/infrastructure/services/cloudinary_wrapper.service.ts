import { injectable } from 'tsyringe';
import { ICloudinaryService } from '../../application/interfaces/i_cloudinary.service';
const oldCloudinaryService = require('../../services/cloudinary.service');

@injectable()
export class CloudinaryWrapperService implements ICloudinaryService {
  async uploadImage(base64Image: string): Promise<string | null> {
    return await oldCloudinaryService.uploadImage(base64Image);
  }
}
