export class MariBankParser {
    canHandle(source) {
        return source === 'maribank';
    }
    async parse(rawBody, fallbackDate) {
        // Expected MariBank payload structure or raw string parsing
        // Since the spec says "extract original_amount, original_currency, and raw_merchant"
        // We assume rawBody is a JSON string from webhook or standard text. 
        // Usually webhooks parse to JSON first. Let's assume rawBody is a JSON string.
        let data;
        try {
            data = JSON.parse(rawBody);
        }
        catch {
            // If it's plain text, we would need Regex. But for now let's assume it's JSON from a Shortcut
            throw new Error('MariBankParser requires JSON rawBody');
        }
        if (!data.merchant || !data.amount || !data.currency) {
            throw new Error('MariBank payload missing required fields');
        }
        return {
            rawMerchant: data.merchant,
            originalCurrency: data.currency,
            originalAmount: parseFloat(data.amount),
            transactedAt: data.timestamp ? new Date(data.timestamp) : fallbackDate
        };
    }
}
