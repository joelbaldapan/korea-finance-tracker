import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useMutateTransactions } from '../hooks/useMutateTransactions';
import './GmailImportModal.css'; // Reuse brutalist modal styles

export function AddTransactionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('KRW');
    const [category, setCategory] = useState('');
    
    const { addManualTransaction } = useMutateTransactions();
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!merchant || !amount) return;
        setLoading(true);
        try {
            await addManualTransaction.mutateAsync({
                raw_merchant: merchant,
                clean_store_name: merchant,
                category: category || 'UNCATEGORIZED',
                original_currency: currency,
                original_amount: parseFloat(amount),
                transacted_at: new Date().toISOString()
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gmail-modal-overlay">
            <div className="gmail-modal-content">
                <button onClick={onClose} className="gmail-modal-close" disabled={loading}>
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="gmail-modal-title">
                    <Plus className="w-6 h-6 inline mr-2" />
                    Manual Entry
                </h2>
                
                <div className="gmail-modal-form">
                    <label className="gmail-modal-label">Merchant Name</label>
                    <input 
                        type="text" 
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        className="brutal-input"
                        placeholder="e.g. GS25"
                    />
                    
                    <label className="gmail-modal-label">Amount</label>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="brutal-input"
                        placeholder="e.g. 5000"
                    />
                    
                    <label className="gmail-modal-label">Currency</label>
                    <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="brutal-input"
                    >
                        <option value="KRW">KRW</option>
                        <option value="PHP">PHP</option>
                    </select>
                    
                    <label className="gmail-modal-label">Category</label>
                    <input 
                        type="text" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="brutal-input"
                        placeholder="e.g. Food"
                    />
                </div>
                
                <button 
                    onClick={handleSubmit} 
                    disabled={loading || !merchant || !amount}
                    className="gmail-modal-btn mt-4"
                >
                    {loading ? 'Saving...' : 'Add Transaction'}
                </button>
            </div>
        </div>
    );
}
