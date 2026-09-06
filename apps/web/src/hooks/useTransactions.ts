import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Transaction } from '@korea-finance-tracker/shared-types';

export function useTransactions() {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .is('deleted_at', null)
                .order('transacted_at', { ascending: false });
                
            if (error) {
                throw error;
            }
            return data as Transaction[];
        }
    });
}
