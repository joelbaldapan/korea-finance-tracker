export type Currency = 'KRW' | 'PHP';

export interface Transaction {
  id: string;
  user_id: string;
  source_id?: string | null;
  raw_merchant: string;
  original_currency: Currency;
  original_amount: number;
  transacted_at: string;
  
  clean_store_name: string | null;
  hangul_name: string | null;
  category: string | null;
  is_online: boolean;
  
  fx_rate: number | null;
  krw_amount: number | null;
  php_amount: number | null;
  
  device_lat: number | null;
  device_lng: number | null;
  merchant_lat: number | null;
  merchant_lng: number | null;
  address: string | null;
  address_en: string | null;
  
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
