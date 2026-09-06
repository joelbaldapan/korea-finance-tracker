import { GoogleGenAI } from '@google/genai';
import type { ITransactionParser, ParsedTransaction } from '../interfaces/index.js';

export class GeminiSmsParser implements ITransactionParser {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  canHandle(source: string): boolean {
    return source.toLowerCase() === 'sms' || source.toLowerCase() === 'ios_shortcut';
  }

  async parse(rawBody: string, fallbackDate: Date): Promise<ParsedTransaction> {
    try {
        const prompt = `
Extract the transaction details from the following SMS message.
Return ONLY a raw JSON object (no markdown, no backticks, just the {}).
Required keys:
- "merchant" (string)
- "amount" (number, digits only)
- "currency" (string, either "KRW" or "PHP" based on context. ₩ is KRW, ₱ or PHP is PHP)

SMS Message:
"${rawBody}"
`;
        
        const result = await this.ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });
        let text = result.text || '';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(text);
        
        if (!parsed.merchant || !parsed.amount || !parsed.currency) {
            throw new Error('Gemini failed to extract required fields');
        }

        return {
            rawMerchant: parsed.merchant,
            originalAmount: parseFloat(parsed.amount),
            originalCurrency: parsed.currency as 'KRW' | 'PHP',
            transactedAt: fallbackDate // We rely on the Shortcut's timestamp
        };
    } catch (e) {
        console.error('GeminiSmsParser Error:', e);
        // Fallback or bubble up error
        throw new Error('Failed to parse SMS using Gemini');
    }
  }
}
