ALTER TABLE public.transactions ADD COLUMN address_en TEXT;
ALTER TABLE public.transactions ADD COLUMN deleted_at TIMESTAMPTZ;
