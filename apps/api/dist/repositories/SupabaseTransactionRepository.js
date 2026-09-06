import { createClient, SupabaseClient } from '@supabase/supabase-js';
export class SupabaseTransactionRepository {
    supabase;
    constructor(url, serviceKey) {
        this.supabase = createClient(url, serviceKey);
    }
    async save(transactionData) {
        const { error } = await this.supabase
            .from('transactions')
            .insert([transactionData]);
        if (error) {
            // Postgres unique violation code is 23505
            if (error.code === '23505') {
                console.log(`Skipping duplicate transaction (source_id: ${transactionData.source_id})`);
                return; // Treat as success
            }
            throw new Error(`Database error: ${error.message}`);
        }
    }
    async updateTransaction(id, userId, data) {
        const { error } = await this.supabase
            .from('transactions')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
    async updateAddressEn(id, userId, addressEn) {
        const { error } = await this.supabase
            .from('transactions')
            .update({ address_en: addressEn, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
}
