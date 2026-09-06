# Supabase & PostgreSQL Standards

You are managing a Supabase PostgreSQL database. Security and raw SQL migrations are your top priorities.

1. **Raw SQL Migrations:** Always generate raw `.sql` files for database migrations. Do not rely on ORM auto-migrations.
2. **Mandatory Row Level Security (RLS):** Every single table MUST have `ENABLE ROW LEVEL SECURITY`. 
3. **Strict RLS Policies:** Write policies that explicitly check `auth.uid() = user_id`. Users must only be able to `SELECT`, `INSERT`, `UPDATE`, or `DELETE` their own rows.
4. **No Client-Side Service Keys:** NEVER use the `SUPABASE_SERVICE_ROLE_KEY` in the frontend code. The frontend must only use the Anon Key and rely on RLS for data protection. The Service Role key is strictly reserved for backend ingestion webhooks.
5. **UUIDs:** Use `uuid` for primary keys and `gen_random_uuid()` as the default value.