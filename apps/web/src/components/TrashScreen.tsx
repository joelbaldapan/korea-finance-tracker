import { useState } from 'react';
import { useTrash } from '../hooks/useTrash';
import { useMutateTransactions } from '../hooks/useMutateTransactions';
import { RotateCcw, Trash, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import './TrashScreen.css';

export function TrashScreen() {
    const { data: transactions, isLoading } = useTrash();
    const { restore, hardDelete, massRestore, massHardDelete } = useMutateTransactions();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    const allIds = (transactions || []).map(t => t.id);
    const allSelected = selectedIds.size === allIds.length && allIds.length > 0;
    
    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };
    
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleMassRestore = async () => {
        if (selectedIds.size === 0) return;
        await massRestore.mutateAsync(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    const handleMassDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Are you sure you want to PERMANENTLY delete ${selectedIds.size} transactions? This cannot be undone.`)) {
            await massHardDelete.mutateAsync(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };
    
    return (
        <div className="trash-screen-container">
            <header className="trash-screen-header">
                <Link to="/" className="trash-back-btn">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="trash-title">TRASH</h1>
                <ThemeToggle />
            </header>

            <main className="trash-main">
                {isLoading && <div className="trash-loading">Loading trash...</div>}
                
                {!isLoading && (!transactions || transactions.length === 0) && (
                    <div className="trash-empty">
                        <span className="trash-empty-text">Trash is empty</span>
                    </div>
                )}
                
                {!isLoading && transactions && transactions.length > 0 && (
                    <div className="flex items-center gap-3 mb-4 justify-between flex-wrap">
                        <label className="flex items-center gap-1 cursor-pointer text-sm font-bold uppercase">
                            <input 
                                type="checkbox" 
                                checked={allSelected} 
                                onChange={toggleSelectAll} 
                                className="w-4 h-4"
                            />
                            Select All
                        </label>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleMassRestore} 
                                disabled={selectedIds.size === 0 || massRestore.isPending}
                                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${selectedIds.size > 0 ? 'bg-green-400 hover:bg-green-500 text-black' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}
                            >
                                Restore Selected
                            </button>
                            <button 
                                onClick={handleMassDelete} 
                                disabled={selectedIds.size === 0 || massHardDelete.isPending}
                                className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${selectedIds.size > 0 ? 'bg-red-400 hover:bg-red-500 text-black' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}
                            >
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}
                
                {transactions?.map(tx => (
                    <div key={tx.id} className={`trash-item-container flex items-center gap-3 ${selectedIds.has(tx.id) ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                        <div className="pt-1">
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(tx.id)}
                                onChange={() => toggleSelect(tx.id)}
                                className="w-4 h-4 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1 w-full min-w-0">
                            <div className="trash-item-header">
                                <span className="trash-item-name">{tx.clean_store_name || tx.raw_merchant}</span>
                                <span className="trash-item-amount">₩{tx.krw_amount?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="trash-item-actions">
                                <button 
                                    onClick={() => restore.mutate(tx.id)}
                                    className="trash-restore-btn"
                                >
                                    <RotateCcw className="w-4 h-4 inline mr-1" /> Restore
                                </button>
                                <button 
                                    onClick={() => hardDelete.mutate(tx.id)}
                                    className="trash-delete-btn"
                                >
                                    <Trash className="w-4 h-4 inline mr-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}
