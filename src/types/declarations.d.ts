declare module 'google-news-url-decoder' {
  export class GoogleDecoder {
    decode(sourceUrl: string): Promise<{
      status: boolean;
      decoded_url?: string;
      message?: string;
    }>;
  }
}
