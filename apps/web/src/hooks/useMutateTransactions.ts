import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useMutateTransactions() {
    const queryClient = useQueryClient();

    const softDelete = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const massSoftDelete = useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await supabase
                .from('transactions')
                .update({ deleted_at: new Date().toISOString() })
                .in('id', ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const restore = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .update({ deleted_at: null })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const hardDelete = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const massRestore = useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await supabase
                .from('transactions')
                .update({ deleted_at: null })
                .in('id', ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const massHardDelete = useMutation({
        mutationFn: async (ids: string[]) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .in('id', ids);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const translate = useMutation({
        mutationFn: async ({ id, address }: { id: string, address: string }) => {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("Not authenticated");
            
            // Assume API runs on port 3000 locally
            const res = await fetch('http://localhost:3000/api/v1/transactions/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ transaction_id: id, address })
            });
            if (!res.ok) throw new Error('Translation failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const editTransaction = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("Not authenticated");
            
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/transactions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Update failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    const addManualTransaction = useMutation({
        mutationFn: async (data: any) => {
            const { data: session } = await supabase.auth.getSession();
            const token = session.session?.access_token;
            if (!token) throw new Error("Not authenticated");
            
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/transactions/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Add manual failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });

    return { softDelete, massSoftDelete, restore, massRestore, hardDelete, massHardDelete, translate, editTransaction, addManualTransaction };
}
