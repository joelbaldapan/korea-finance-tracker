import { describe, it, expect } from 'vitest';
import { MariBankParser } from './MariBankParser.js';
describe('MariBankParser', () => {
    const parser = new MariBankParser();
    it('should declare it can handle maribank source', () => {
        expect(parser.canHandle('maribank')).toBe(true);
        expect(parser.canHandle('gcash')).toBe(false);
    });
    it('should parse valid maribank payload', async () => {
        const payload = JSON.stringify({
            merchant: 'MariBank Transfer',
            amount: '150.00',
            currency: 'PHP',
            timestamp: '2023-10-01T12:00:00Z'
        });
        const fallback = new Date();
        const result = await parser.parse(payload, fallback);
        expect(result.rawMerchant).toBe('MariBank Transfer');
        expect(result.originalAmount).toBe(150.00);
        expect(result.originalCurrency).toBe('PHP');
        expect(result.transactedAt).toEqual(new Date('2023-10-01T12:00:00Z'));
    });
    it('should use fallback date if timestamp is missing', async () => {
        const payload = JSON.stringify({
            merchant: 'MariBank Transfer',
            amount: '150.00',
            currency: 'PHP'
        });
        const fallback = new Date();
        const result = await parser.parse(payload, fallback);
        expect(result.transactedAt).toEqual(fallback);
    });
    it('should throw on invalid json', async () => {
        await expect(parser.parse('Invalid string', new Date())).rejects.toThrow();
    });
    it('should throw on missing fields', async () => {
        const payload = JSON.stringify({ merchant: 'Test' });
        await expect(parser.parse(payload, new Date())).rejects.toThrow('MariBank payload missing required fields');
    });
});
