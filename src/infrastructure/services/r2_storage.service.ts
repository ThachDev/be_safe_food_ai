import { ICloudinaryService } from '../../application/interfaces/i_cloudinary.service';

export class R2StorageService implements ICloudinaryService {
  constructor(private bucket: any, private requestHost?: string) {}

  async uploadImage(base64String: string): Promise<string | null> {
    if (!base64String) return null;

    try {
      let mimeType = 'image/jpeg';
      let base64Data = base64String;

      const mimeMatch = base64String.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
        base64Data = base64String.substring(mimeMatch[0].length);
      }

      // Decode base64 to binary
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate a unique key
      const fileExt = mimeType.split('/')[1] || 'jpg';
      const uniqueId = crypto.randomUUID();
      const key = `scans/${uniqueId}.${fileExt}`;

      // Upload to R2 Bucket
      await this.bucket.put(key, bytes.buffer, {
        httpMetadata: { contentType: mimeType }
      });

      // Construct URL. If requestHost is provided, return full URL, else path.
      if (this.requestHost) {
        const protocol = this.requestHost.includes('localhost') ? 'http' : 'https';
        return `${protocol}://${this.requestHost}/api/v1/app/images/${key}`;
      }
      return `/api/v1/app/images/${key}`;
    } catch (error) {
      console.error('[R2StorageService.uploadImage] Error:', error);
      return null;
    }
  }
}
