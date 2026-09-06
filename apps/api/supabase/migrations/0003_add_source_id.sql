ALTER TABLE public.transactions
ADD COLUMN source_id TEXT;

-- We want to ensure we don't import the same email twice for the same user.
-- If source_id is NULL (e.g. manual entries or webhooks without an ID), we don't want it to conflict,
-- so we can add a unique index that only applies when source_id is not null.
CREATE UNIQUE INDEX unique_user_source_id ON public.transactions(user_id, source_id) WHERE source_id IS NOT NULL;
