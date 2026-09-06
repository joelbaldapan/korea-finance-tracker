import type { IFxRateService } from '../interfaces/index.js';
import type { Currency } from '@korea-finance-tracker/shared-types';

export class FxRateService implements IFxRateService {
  async getRates(date: Date, baseCurrency: Currency): Promise<{ KRW: number; PHP: number; rate: number }> {
    const dateString = date.toISOString().split('T')[0];
    const targetCurrency = baseCurrency === 'KRW' ? 'PHP' : 'KRW';
    
    const url = `https://api.frankfurter.app/${dateString}?from=${baseCurrency}&to=${targetCurrency}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch FX rates: ${res.statusText}`);
    }
    const data = await res.json();
    
    const rate = data.rates[targetCurrency];
    return {
        KRW: baseCurrency === 'KRW' ? 1 : rate,
        PHP: baseCurrency === 'PHP' ? 1 : rate,
        rate
    };
  }
}
