import { GoogleGenAI, Type } from '@google/genai';
import type { IMerchantEnricher, EnrichedMerchant } from '../interfaces/index.js';

export class GeminiMerchantEnricher implements IMerchantEnricher {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async enrich(rawMerchant: string, retries = 3, delayMs = 15000): Promise<EnrichedMerchant> {
    try {
      const response = await this.ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Analyze this Korean or Philippines merchant name and extract details: "${rawMerchant}"`,
          config: {
              responseMimeType: 'application/json',
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      cleanStoreName: { type: Type.STRING, nullable: true },
                      hangulName: { type: Type.STRING, nullable: true },
                      category: { type: Type.STRING, nullable: true },
                      isOnline: { type: Type.BOOLEAN }
                  },
                  required: ['isOnline']
              }
          }
      });
      
      if (!response.text) {
          throw new Error("Failed to generate response from Gemini");
      }
      
      return JSON.parse(response.text) as EnrichedMerchant;
    } catch (error: any) {
      if (retries > 0) {
        console.warn(`Gemini API Error. Retrying in ${delayMs}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.enrich(rawMerchant, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }
}
