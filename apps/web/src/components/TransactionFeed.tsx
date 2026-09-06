import { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useMutateTransactions } from '../hooks/useMutateTransactions';
import { MapPin, ShoppingBag, Globe, Trash2, Languages, Edit2, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { Transaction } from '@korea-finance-tracker/shared-types';
import './TransactionFeed.css';

export function TransactionFeed({ selectedMonths }: { selectedMonths: Set<number> }) {
    const { data: allTransactions, isLoading } = useTransactions();
    const { massSoftDelete } = useMutateTransactions();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    
    const transactions = (allTransactions || []).filter(t => {
        if (selectedMonths.size === 0) return true;
        const d = new Date(t.transacted_at);
        return selectedMonths.has(d.getMonth()) && d.getFullYear() === new Date().getFullYear();
    });
    
    if (isLoading) {
        return <div className="p-4 font-bold uppercase border-2 border-black dark:border-white text-center">Loading feed...</div>;
    }
    
    if (!transactions || transactions.length === 0) {
        return (
            <div className="p-8 text-center border-4 border-dashed border-black dark:border-white">
                <span className="font-bold uppercase tracking-wider">No transactions yet</span>
            </div>
        );
    }
    
    const allIds = transactions.map(t => t.id);
    const allSelected = selectedIds.size === transactions.length && transactions.length > 0;
    
    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };
    
    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };
    
    const handleMassDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
            await massSoftDelete.mutateAsync(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };
    
    const handleToggleNotesSelected = () => {
        if (selectedIds.size === 0) return;
        const next = new Set(expandedNotes);
        let allSelectedExpanded = true;
        selectedIds.forEach(id => {
            if (!next.has(id)) allSelectedExpanded = false;
        });

        if (allSelectedExpanded) {
            // Unshow all
            selectedIds.forEach(id => next.delete(id));
        } else {
            // Show all
            selectedIds.forEach(id => next.add(id));
        }
        setExpandedNotes(next);
    };
    
    return (
        <div className="feed-container">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="feed-title m-0">Feed ({transactions.length} total)</h3>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer text-sm font-bold uppercase">
                        <input 
                            type="checkbox" 
                            checked={allSelected} 
                            onChange={toggleSelectAll} 
                            className="w-4 h-4"
                        />
                        Select All
                    </label>
                    <button 
                        onClick={handleToggleNotesSelected} 
                        disabled={selectedIds.size === 0}
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${selectedIds.size > 0 ? 'bg-blue-400 hover:bg-blue-500 text-black' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}
                    >
                        Toggle Notes ({selectedIds.size})
                    </button>
                    <button 
                        onClick={handleMassDelete} 
                        disabled={selectedIds.size === 0 || massSoftDelete.isPending}
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black transition-colors ${selectedIds.size > 0 ? 'bg-red-400 hover:bg-red-500 text-black' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}
                    >
                        Delete Selected ({selectedIds.size})
                    </button>
                </div>
            </div>
            
            <div className="feed-list">
                {transactions.map((tx) => (
                    <TransactionItem 
                        key={tx.id} 
                        transaction={tx} 
                        isSelected={selectedIds.has(tx.id)}
                        onToggleSelect={() => toggleSelect(tx.id)}
                        isNotesExpanded={expandedNotes.has(tx.id)}
                        onToggleNotes={() => {
                            const next = new Set(expandedNotes);
                            if (next.has(tx.id)) next.delete(tx.id);
                            else next.add(tx.id);
                            setExpandedNotes(next);
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function TransactionItem({ transaction: tx, isSelected, onToggleSelect, isNotesExpanded, onToggleNotes }: { transaction: Transaction, isSelected: boolean, onToggleSelect: () => void, isNotesExpanded: boolean, onToggleNotes: () => void }) {
    const { softDelete, translate, editTransaction } = useMutateTransactions();
    const [isEditing, setIsEditing] = useState(false);
    const [editNote, setEditNote] = useState(tx.notes || '');
    
    const [editName, setEditName] = useState(tx.clean_store_name || tx.raw_merchant || '');
    const [editCategory, setEditCategory] = useState(tx.category || '');
    const [editAmountKRW, setEditAmountKRW] = useState(tx.krw_amount?.toString() || '');
    const [editAmountPHP, setEditAmountPHP] = useState(tx.php_amount?.toString() || '');
    const [isSaving, setIsSaving] = useState(false);

    const name = tx.clean_store_name || tx.raw_merchant;
    const date = new Date(tx.transacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await editTransaction.mutateAsync({
                id: tx.id,
                data: {
                    clean_store_name: editName,
                    category: editCategory,
                    krw_amount: parseFloat(editAmountKRW) || null,
                    php_amount: parseFloat(editAmountPHP) || null
                }
            });
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNote = async () => {
        setIsSaving(true);
        try {
            await editTransaction.mutateAsync({
                id: tx.id,
                data: {
                    notes: editNote
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="tx-item-container border-2 border-yellow-400">
                <div className="flex flex-col gap-2 p-2">
                    <input 
                        className="brutal-input text-sm p-1" 
                        value={editName} 
                        onChange={e => setEditName(e.target.value)} 
                        placeholder="Merchant Name" 
                    />
                    <input 
                        className="brutal-input text-sm p-1" 
                        value={editCategory} 
                        onChange={e => setEditCategory(e.target.value)} 
                        placeholder="Category" 
                    />
                    <div className="flex gap-2">
                        <input 
                            type="number"
                            className="brutal-input text-sm p-1 flex-1" 
                            value={editAmountKRW} 
                            onChange={e => setEditAmountKRW(e.target.value)} 
                            placeholder="KRW Amount" 
                        />
                        <input 
                            type="number"
                            className="brutal-input text-sm p-1 flex-1" 
                            value={editAmountPHP} 
                            onChange={e => setEditAmountPHP(e.target.value)} 
                            placeholder="PHP Amount" 
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1 border-2 border-black dark:border-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors font-bold uppercase text-xs" disabled={isSaving}>Cancel</button>
                        <button onClick={handleSave} className="px-3 py-1 bg-yellow-400 text-black border-2 border-black hover:bg-yellow-300 transition-colors font-bold uppercase text-xs flex items-center" disabled={isSaving}>
                            <Check className="w-3 h-3 mr-1" /> Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`tx-item-container group flex items-start gap-3 ${isSelected ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
            <div className="pt-2 pl-2 flex items-center gap-2">
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-4 h-4 cursor-pointer"
                />
                <button 
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                    aria-label="Edit"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>
            <div className="flex-1 w-full min-w-0">
                <div className="tx-actions">
                <button 
                    onClick={() => softDelete.mutate(tx.id)}
                    className="tx-delete-btn"
                    aria-label="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            
            <div className="tx-header">
                <div className="tx-info">
                    <span className="tx-name">{name}</span>
                    <div className="tx-meta">
                        {tx.is_online ? <Globe className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                        <span className="tx-category">{tx.category || 'Uncategorized'}</span>
                    </div>
                </div>
                
                <div className="tx-amounts">
                    <span className="tx-krw">₩{tx.krw_amount?.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    <span className="tx-php">₱{tx.php_amount?.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
            </div>
            
            
            <div className="tx-footer flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="tx-date">{date}</span>
                    <button 
                        onClick={onToggleNotes}
                        className="flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <FileText className="w-3 h-3" />
                        {isNotesExpanded ? 'Hide Notes' : 'Notes'}
                        {isNotesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>
                
                {tx.address && (
                    <div className="tx-location-container">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="tx-location-text">{tx.address_en || tx.address}</span>
                        {!tx.address_en && (
                            <button 
                                onClick={() => translate.mutate({ id: tx.id, address: tx.address! })}
                                disabled={translate.isPending}
                                className="tx-translate-btn"
                            >
                                <Languages className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            {isNotesExpanded && (
                <div className="mt-2 w-full border-t-2 border-dashed border-gray-300 dark:border-gray-700 pt-2">
                    <textarea 
                        className="brutal-input text-sm p-2 w-full min-h-[60px] resize-y" 
                        placeholder="Add a note for this transaction..."
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                        <button 
                            onClick={handleSaveNote} 
                            disabled={isSaving || editNote === (tx.notes || '')}
                            className="px-3 py-1 bg-yellow-400 text-black border-2 border-black hover:bg-yellow-300 transition-colors font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Note
                        </button>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
