import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Transaction } from '@korea-finance-tracker/shared-types';

export function useTrash() {
    return useQuery({
        queryKey: ['transactions', 'trash'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });
                
            if (error) throw error;
            return data as Transaction[];
        }
    });
}
