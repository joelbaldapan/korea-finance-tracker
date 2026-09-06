import { useTrash } from '../hooks/useTrash';
import { useMutateTransactions } from '../hooks/useMutateTransactions';
import { RotateCcw, Trash, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import './TrashScreen.css';

export function TrashScreen() {
    const { data: transactions, isLoading } = useTrash();
    const { restore, hardDelete } = useMutateTransactions();
    
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
                
                {transactions?.map(tx => (
                    <div key={tx.id} className="trash-item-container">
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
                ))}
            </main>
        </div>
    );
}
