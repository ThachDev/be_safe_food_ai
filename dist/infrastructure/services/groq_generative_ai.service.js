"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqGenerativeAiService = void 0;
const tsyringe_1 = require("tsyringe");
const Groq = require('groq-sdk');
const GROQ_MODEL_TEXT = 'llama-3.3-70b-versatile';
const GROQ_MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';
let GroqGenerativeAiService = class GroqGenerativeAiService {
    groq;
    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not configured in backend');
        }
        this.groq = new Groq({ apiKey });
    }
    async analyzeFoodWithVision(systemPrompt, prompt, base64Image) {
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
    async analyzeTextOnly(systemPrompt, prompt) {
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
    async analyzeVisionWithJsonFormat(prompt, base64Image) {
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
        }
        catch (e) {
            console.warn('[AIService] Llama 4 Scout failed, falling back to Llama 3.2 Vision:', e.message);
            const completion = await this.groq.chat.completions.create({
                model: GROQ_MODEL_VISION, // fallback model if needed
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
};
exports.GroqGenerativeAiService = GroqGenerativeAiService;
exports.GroqGenerativeAiService = GroqGenerativeAiService = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [])
], GroqGenerativeAiService);
