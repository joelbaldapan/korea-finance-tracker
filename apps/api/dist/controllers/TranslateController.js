import { Context } from 'hono';
import { GeminiTranslationService } from '../services/GeminiTranslationService.js';
export class TranslateController {
    translationService;
    transactionRepository;
    constructor(translationService, transactionRepository) {
        this.translationService = translationService;
        this.transactionRepository = transactionRepository;
    }
    async handleTranslate(c, user_id, transaction_id, address) {
        try {
            const translated = await this.translationService.translateKoreanAddress(address);
            await this.transactionRepository.updateAddressEn(transaction_id, user_id, translated);
            return c.json({ success: true, address_en: translated });
        }
        catch (e) {
            console.error('Translation error:', e);
            return c.json({ error: 'Translation failed', details: e.message }, 500);
        }
    }
}
