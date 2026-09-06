import type { ITransactionParser, ParsedTransaction } from '../interfaces/index.js';

export class GmailMaribankParser implements ITransactionParser {
  canHandle(source: string): boolean {
    return source === 'gmail';
  }

  async parse(rawBody: string, fallbackDate: Date): Promise<ParsedTransaction> {
    // Normalize newlines and whitespace
    const cleanBody = rawBody.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ');
    
    // Attempt exact regex formats for Maribank emails
    let merchant = '';
    let currency = '';
    let amountStr = '';
    
    // Format 1: 
    // Transaction Amount: KRW 3500
    // Merchant: OOZY COFFEE NOWON EUL
    // (We use a non-greedy match and look for 'Please' or end of string)
    const amountRegex = /Transaction Amount:\s*([A-Z]{3})\s*([\d,.]+)/i;
    const merchantRegex = /Merchant:\s*(.+?)(?:Please|$)/i;
    
    // Format 2: Your MariCard Debit transaction at STARBUCKS for KRW 4,500.00 was successful
    const regex1 = /transaction at\s+(.+?)\s+for\s+([A-Z]{3})\s+([\d,.]+)\s+was successful/i;
    
    // Format 3: transaction of SGD 5.00 at MERCHANT was successful
    const regex2 = /transaction of\s+([A-Z]{3})\s+([\d,.]+)\s+at\s+(.+?)\s+was successful/i;
    
    const amountMatch = cleanBody.match(amountRegex);
    const merchantMatch = cleanBody.match(merchantRegex);
    const match1 = cleanBody.match(regex1);
    const match2 = cleanBody.match(regex2);
    
    if (amountMatch && merchantMatch) {
        currency = amountMatch[1].toUpperCase();
        amountStr = amountMatch[2];
        merchant = merchantMatch[1].trim();
    } else if (match1) {
        merchant = match1[1].trim();
        currency = match1[2].toUpperCase();
        amountStr = match1[3];
    } else if (match2) {
        currency = match2[1].toUpperCase();
        amountStr = match2[2];
        merchant = match2[3].trim();
    } else {
        throw new Error("Could not extract merchant and amount from email body safely. Text: " + cleanBody.substring(0, 50));
    }
    
    const amount = parseFloat(amountStr.replace(/,/g, ''));
    
    // Ensure currency is cast appropriately
    const origCurrency = (currency === 'KRW' || currency === 'PHP') ? currency : 'KRW';
    
    return {
      rawMerchant: merchant,
      originalCurrency: origCurrency as 'KRW' | 'PHP',
      originalAmount: amount,
      transactedAt: fallbackDate
    };
  }
}
