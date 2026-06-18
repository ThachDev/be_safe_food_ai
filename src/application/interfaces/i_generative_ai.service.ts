export interface IGenerativeAiService {
  analyzeFoodWithVision(systemPrompt: string, prompt: string, base64Image: string): Promise<string>;
  analyzeTextOnly(systemPrompt: string, prompt: string): Promise<string>;
  analyzeVisionWithJsonFormat(prompt: string, base64Image: string): Promise<string>;
}
