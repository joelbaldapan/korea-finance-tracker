import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ITransactionRepository } from '../interfaces/index.js';
import type { Transaction } from '@korea-finance-tracker/shared-types';

export class SupabaseTransactionRepository implements ITransactionRepository {
    private supabase: SupabaseClient;
    
    constructor(url: string, serviceKey: string) {
        this.supabase = createClient(url, serviceKey);
    }
    
    async save(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<void> {
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
    
    async updateTransaction(id: string, userId: string, data: Partial<Transaction>): Promise<void> {
        const { error } = await this.supabase
            .from('transactions')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId);
            
        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }
    }
    
    async updateAddressEn(id: string, userId: string, addressEn: string): Promise<void> {
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
