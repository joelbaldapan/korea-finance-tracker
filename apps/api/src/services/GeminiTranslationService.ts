import { GoogleGenAI } from '@google/genai';

export class GeminiTranslationService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async translateKoreanAddress(address: string): Promise<string> {
    const response = await this.ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Translate the following Korean address into English. Return ONLY the English translation, with no extra text or quotes: "${address}"`,
    });
    
    if (!response.text) {
        throw new Error("Failed to translate address");
    }
    
    return response.text.trim();
  }
}
