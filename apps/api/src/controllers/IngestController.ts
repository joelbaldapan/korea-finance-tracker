import { Context } from 'hono';
import { ParserFactory } from '../parsers/ParserFactory.js';
import type { IFxRateService, IMerchantEnricher, IGeocodingService, ITransactionRepository } from '../interfaces/index.js';

export class IngestController {
    constructor(
        private parserFactory: ParserFactory,
        private fxRateService: IFxRateService,
        private merchantEnricher: IMerchantEnricher,
        private geocodingService: IGeocodingService,
        private transactionRepository: ITransactionRepository
    ) {}

    async handleIngest(c: Context) {
        try {
            const body = await c.req.json();
            const { source, raw_body, timestamp, device_location, user_id } = body;
            
            const parser = this.parserFactory.getParser(source);
            const parsed = await parser.parse(raw_body, timestamp ? new Date(timestamp) : new Date());
            
            const fx = await this.fxRateService.getRates(parsed.transactedAt, parsed.originalCurrency);
            
            let enriched: any = { cleanStoreName: null, hangulName: null, category: 'Enrichment Failed', isOnline: false };
            try {
                enriched = await this.merchantEnricher.enrich(parsed.rawMerchant);
            } catch (err) {
                console.error(`Enrichment failed for ${parsed.rawMerchant}:`, err);
            }
            
            let geocode = null;
            if (!enriched.isOnline) {
                const keyword = enriched.hangulName || enriched.cleanStoreName || parsed.rawMerchant;
                geocode = await this.geocodingService.geocode(
                    keyword,
                    device_location?.lat,
                    device_location?.lng
                );
            }
            
            const krw = parsed.originalAmount * fx.KRW;
            const php = parsed.originalAmount * fx.PHP;
            
            await this.transactionRepository.save({
                user_id: user_id,
                raw_merchant: parsed.rawMerchant,
                original_currency: parsed.originalCurrency,
                original_amount: parsed.originalAmount,
                transacted_at: parsed.transactedAt.toISOString(),
                clean_store_name: enriched.cleanStoreName,
                hangul_name: enriched.hangulName,
                category: enriched.category,
                is_online: enriched.isOnline,
                fx_rate: fx.rate,
                krw_amount: krw,
                php_amount: php,
                device_lat: device_location?.lat || null,
                device_lng: device_location?.lng || null,
                merchant_lat: geocode?.lat || null,
                merchant_lng: geocode?.lng || null,
                address: geocode?.address || null,
                address_en: null,
                notes: null
            });
            
            return c.json({ success: true, message: 'Transaction ingested successfully' });
        } catch (e: any) {
            console.error('Ingestion error:', e);
            return c.json({ error: 'Ingestion failed', details: e.message }, 500);
        }
    }
    async handleUserImport(c: Context, userId: string) {
        try {
            const body = await c.req.json();
            const { items } = body; // Array of { source, raw_body, timestamp, device_location, source_id }
            
            if (!Array.isArray(items)) {
                return c.json({ error: 'Invalid payload, expected items array' }, 400);
            }

            const results = [];
            
            for (const item of items) {
                let parsedMerchantName = 'Unknown';
                try {
                    const { source, raw_body, timestamp, device_location, source_id, skip_enrichment } = item;
                    
                    const parser = this.parserFactory.getParser(source);
                    const parsed = await parser.parse(raw_body, timestamp ? new Date(timestamp) : new Date());
                    parsedMerchantName = parsed.rawMerchant;
                    
                    const fx = await this.fxRateService.getRates(parsed.transactedAt, parsed.originalCurrency);
                    
                    let enriched: any = { cleanStoreName: null, hangulName: null, category: skip_enrichment ? 'Uncategorized' : 'Enrichment Failed', isOnline: false };
                    if (!skip_enrichment) {
                        try {
                            enriched = await this.merchantEnricher.enrich(parsed.rawMerchant);
                        } catch (err) {
                            console.error(`Enrichment failed for ${parsed.rawMerchant}:`, err);
                        }
                    }
                    
                    let geocode = null;
                    if (!enriched.isOnline) {
                        const keyword = enriched.hangulName || enriched.cleanStoreName || parsed.rawMerchant;
                        geocode = await this.geocodingService.geocode(
                            keyword,
                            device_location?.lat,
                            device_location?.lng
                        );
                    }
                    
                    const krw = parsed.originalAmount * fx.KRW;
                    const php = parsed.originalAmount * fx.PHP;
                    
                    await this.transactionRepository.save({
                        user_id: userId,
                        source_id: source_id || null,
                        raw_merchant: parsed.rawMerchant,
                        original_currency: parsed.originalCurrency,
                        original_amount: parsed.originalAmount,
                        transacted_at: parsed.transactedAt.toISOString(),
                        clean_store_name: enriched.cleanStoreName,
                        hangul_name: enriched.hangulName,
                        category: enriched.category,
                        is_online: enriched.isOnline,
                        fx_rate: fx.rate,
                        krw_amount: krw,
                        php_amount: php,
                        device_lat: device_location?.lat || null,
                        device_lng: device_location?.lng || null,
                        merchant_lat: geocode?.lat || null,
                        merchant_lng: geocode?.lng || null,
                        address: geocode?.address || null,
                        address_en: null,
                        notes: null
                    });
                    
                    results.push({ success: true, raw_merchant: parsed.rawMerchant });
                } catch (e: any) {
                    console.error(`Failed to import item (Merchant: ${parsedMerchantName}):`, e);
                    results.push({ success: false, error: `[${parsedMerchantName}] ${e.message}` });
                }
            }
            
            return c.json({ success: true, results });
        } catch (e: any) {
            console.error('Import error:', e);
            return c.json({ error: 'Import failed', details: e.message }, 500);
        }
    }

    async handleUpdate(c: Context, userId: string, transactionId: string) {
        try {
            const body = await c.req.json();
            await this.transactionRepository.updateTransaction(transactionId, userId, body);
            return c.json({ success: true });
        } catch (e: any) {
            console.error('Update error:', e);
            return c.json({ error: 'Update failed', details: e.message }, 500);
        }
    }

    async handleManualEntry(c: Context, userId: string) {
        try {
            const body = await c.req.json();
            const { raw_merchant, clean_store_name, category, original_currency, original_amount, transacted_at } = body;
            
            const fx = await this.fxRateService.getRates(new Date(transacted_at), original_currency);
            
            const krw = original_amount * fx.KRW;
            const php = original_amount * fx.PHP;
            
            await this.transactionRepository.save({
                user_id: userId,
                source_id: null,
                raw_merchant,
                original_currency,
                original_amount,
                transacted_at,
                clean_store_name,
                category,
                is_online: false,
                fx_rate: fx.rate,
                krw_amount: krw,
                php_amount: php,
                device_lat: null,
                device_lng: null,
                merchant_lat: null,
                merchant_lng: null,
                address: null,
                address_en: null,
                hangul_name: null,
                notes: null
            });
            
            return c.json({ success: true });
        } catch (e: any) {
            console.error('Manual entry error:', e);
            return c.json({ error: 'Manual entry failed', details: e.message }, 500);
        }
    }
}
