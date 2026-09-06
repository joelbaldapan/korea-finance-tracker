export class FxRateService {
    async getRates(date, baseCurrency) {
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
