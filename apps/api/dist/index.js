import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { config } from 'dotenv';
import { ParserFactory } from './parsers/ParserFactory.js';
import { MariBankParser } from './parsers/MariBankParser.js';
import { FxRateService } from './services/FxRateService.js';
import { GeminiMerchantEnricher } from './services/GeminiMerchantEnricher.js';
import { KakaoGeocodingService } from './services/KakaoGeocodingService.js';
import { SupabaseTransactionRepository } from './repositories/SupabaseTransactionRepository.js';
import { IngestController } from './controllers/IngestController.js';
import { createTransactionsRouter } from './routes/transactions.js';
import { TranslateController } from './controllers/TranslateController.js';
import { GeminiTranslationService } from './services/GeminiTranslationService.js';
import { cors } from 'hono/cors';
config({ path: '.env' });
const app = new Hono();
app.use('*', cors());
import { GmailMaribankParser } from './parsers/GmailMaribankParser.js';
import { GeminiSmsParser } from './parsers/GeminiSmsParser.js';
const parserFactory = new ParserFactory();
parserFactory.register(new MariBankParser());
parserFactory.register(new GmailMaribankParser());
parserFactory.register(new GeminiSmsParser(process.env.GEMINI_API_KEY || ''));
const fxService = new FxRateService();
const enricher = new GeminiMerchantEnricher(process.env.GEMINI_API_KEY || '');
const geocoding = new KakaoGeocodingService(process.env.KAKAO_REST_API_KEY || '');
const repo = new SupabaseTransactionRepository(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const translationService = new GeminiTranslationService(process.env.GEMINI_API_KEY || '');
const ingestController = new IngestController(parserFactory, fxService, enricher, geocoding, repo);
const translateController = new TranslateController(translationService, repo);
const transactionsRouter = createTransactionsRouter(ingestController, translateController, process.env.API_BEARER_TOKEN || '', process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
app.route('/api/v1/transactions', transactionsRouter);
app.get('/', (c) => {
    return c.text('Korea Finance Tracker API');
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on port ${port}`);
serve({
    fetch: app.fetch,
    port
});
