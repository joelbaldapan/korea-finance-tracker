import { Context } from 'hono';
import { GeminiTranslationService } from '../services/GeminiTranslationService.js';
import type { ITransactionRepository } from '../interfaces/index.js';

export class TranslateController {
    constructor(
        private translationService: GeminiTranslationService,
        private transactionRepository: ITransactionRepository
    ) {}

    async handleTranslate(c: Context, user_id: string, transaction_id: string, address: string) {
        try {
            const translated = await this.translationService.translateKoreanAddress(address);
            
            await this.transactionRepository.updateAddressEn(transaction_id, user_id, translated);
            
            return c.json({ success: true, address_en: translated });
        } catch (e: any) {
            console.error('Translation error:', e);
            return c.json({ error: 'Translation failed', details: e.message }, 500);
        }
    }
}
