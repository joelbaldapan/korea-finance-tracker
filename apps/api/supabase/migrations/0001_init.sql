CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Source Data
    raw_merchant TEXT NOT NULL,
    original_currency TEXT NOT NULL CHECK (original_currency IN ('KRW', 'PHP')),
    original_amount NUMERIC NOT NULL,
    transacted_at TIMESTAMPTZ NOT NULL,
    
    -- Enriched Data (LLM)
    clean_store_name TEXT,
    hangul_name TEXT,
    category TEXT,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Currency Conversion
    fx_rate NUMERIC,
    krw_amount NUMERIC,
    php_amount NUMERIC,
    
    -- Geospatial Data
    device_lat NUMERIC,
    device_lng NUMERIC,
    merchant_lat NUMERIC,
    merchant_lng NUMERIC,
    address TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Optional: Trigger to update the updated_at timestamp on row modifications
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
