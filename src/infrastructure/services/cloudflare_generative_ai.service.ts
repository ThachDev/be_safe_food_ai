import { IGenerativeAiService } from '../../application/interfaces/i_generative_ai.service';

export class CloudflareGenerativeAiService implements IGenerativeAiService {
  private env: any;

  constructor(env: any) {
    this.env = env;
    if (!env.AI) {
      throw new Error('Cloudflare Workers AI binding (env.AI) is not configured');
    }
  }

  private base64ToArray(base64: string): number[] {
    const raw = atob(base64.replace(/^data:image\/\w+;base64,/, ""));
    const array = new Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }

  private extractJson(str: string): string {
    const start = str.indexOf('{');
    const end = str.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return str.substring(start, end + 1);
    }
    return str.trim();
  }

  async analyzeFoodWithVision(systemPrompt: string, prompt: string, base64Image: string): Promise<string> {
    const maxAttempts = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const imageArray = this.base64ToArray(base64Image);
        
        console.log(`[AIService] Calling Cloudflare Workers AI Llama 3.2 Vision... (Attempt ${attempt}/${maxAttempts})`);
        const response = await this.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          image: imageArray,
          max_tokens: 1024
        });
        
        const resVal = response.response;
        if (typeof resVal === 'object') {
          return JSON.stringify(resVal);
        }
        return resVal || 'Không có phản hồi từ Cloudflare AI.';
      } catch (e: any) {
        lastError = e;
        console.warn(`[AIService] Cloudflare Vision failed on attempt ${attempt}:`, e.message);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error(`[AIService] Cloudflare Vision failed after ${maxAttempts} attempts:`, lastError?.message);
    return `Lỗi phân tích hình ảnh sau ${maxAttempts} lần thử: ${lastError?.message || 'Lỗi không xác định'}`;
  }

  async analyzeTextOnly(systemPrompt: string, prompt: string): Promise<string> {
    const maxAttempts = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[AIService] Calling Cloudflare Workers AI Llama 3.2 3B Text... (Attempt ${attempt}/${maxAttempts})`);
        const response = await this.env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1024
        });
        const resVal = response.response;
        if (typeof resVal === 'object') {
          return JSON.stringify(resVal);
        }
        return resVal || 'Không có phản hồi từ Cloudflare AI.';
      } catch (e: any) {
        lastError = e;
        console.warn(`[AIService] Cloudflare Text failed on attempt ${attempt}:`, e.message);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error(`[AIService] Cloudflare Text failed after ${maxAttempts} attempts:`, lastError?.message);
    return `Lỗi phân tích văn bản sau ${maxAttempts} lần thử: ${lastError?.message || 'Lỗi không xác định'}`;
  }

  async analyzeVisionWithJsonFormat(prompt: string, base64Image: string): Promise<string> {
    const maxAttempts = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const imageArray = this.base64ToArray(base64Image);
        
        console.log(`[AIService] Calling Cloudflare Workers AI Llama 3.2 Vision (JSON format)... (Attempt ${attempt}/${maxAttempts})`);
        const response = await this.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          messages: [
            { role: 'system', content: 'You are a helpful assistant that MUST respond only with a valid JSON block matching the user requirements. Do not include any explanations, introduction, or markdown backticks outside of the JSON block.' },
            { role: 'user', content: prompt }
          ],
          image: imageArray,
          max_tokens: 1024
        });
        
        let rawContent = response.response || '{}';
        if (typeof rawContent === 'object') {
          return JSON.stringify(rawContent);
        }
        rawContent = this.extractJson(rawContent);
        rawContent = rawContent.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        return rawContent;
      } catch (e: any) {
        lastError = e;
        console.warn(`[AIService] Cloudflare Vision JSON failed on attempt ${attempt}:`, e.message);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error(`[AIService] Cloudflare Vision JSON failed after ${maxAttempts} attempts:`, lastError?.message);
    return JSON.stringify({ error: "AI analysis is currently unavailable." });
  }
}
