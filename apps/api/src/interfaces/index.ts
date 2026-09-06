import type { Currency, Transaction } from '@korea-finance-tracker/shared-types';

export interface ParsedTransaction {
  rawMerchant: string;
  originalCurrency: Currency;
  originalAmount: number;
  transactedAt: Date;
}

export interface ITransactionParser {
  canHandle(source: string): boolean;
  parse(rawBody: string, fallbackDate: Date): Promise<ParsedTransaction>;
}

export interface IFxRateService {
  getRates(date: Date, baseCurrency: Currency): Promise<{ KRW: number; PHP: number; rate: number }>;
}

export interface EnrichedMerchant {
  cleanStoreName: string | null;
  hangulName: string | null;
  category: string | null;
  isOnline: boolean;
}

export interface IMerchantEnricher {
  enrich(rawMerchant: string): Promise<EnrichedMerchant>;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string | null;
}

export interface IGeocodingService {
  geocode(keyword: string, deviceLat?: number, deviceLng?: number): Promise<GeocodeResult | null>;
}

export interface ITransactionRepository {
  save(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<void>;
  updateTransaction(id: string, userId: string, data: Partial<Transaction>): Promise<void>;
  updateAddressEn(id: string, userId: string, addressEn: string): Promise<void>;
}
