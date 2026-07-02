import { IGenerativeAiService } from '../../application/interfaces/i_generative_ai.service';
import Groq from 'groq-sdk';

const GROQ_MODEL_TEXT = 'llama-3.3-70b-versatile';
const GROQ_MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

export class GroqGenerativeAiService implements IGenerativeAiService {
  private groq: Groq;

  constructor(env: any) {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured in backend');
    }
    this.groq = new Groq({ apiKey });
  }

  async analyzeFoodWithVision(systemPrompt: string, prompt: string, base64Image: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODEL_VISION,
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
  }

  async analyzeTextOnly(systemPrompt: string, prompt: string): Promise<string> {
    const completion = await this.groq.chat.completions.create({
      model: GROQ_MODEL_TEXT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.';
  }

  async analyzeVisionWithJsonFormat(prompt: string, base64Image: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
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
      return completion.choices[0]?.message?.content ?? '';
    } catch (e: any) {
      console.warn('[AIService] Llama 4 Scout failed, falling back:', e.message);
      const completion = await this.groq.chat.completions.create({
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
      return completion.choices[0]?.message?.content ?? '';
    }
  }
}
