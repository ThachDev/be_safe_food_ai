export interface ICloudinaryService {
  uploadImage(base64Image: string): Promise<string | null>;
}
