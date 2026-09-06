import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './SettingsModal.css';

export function SettingsModal({ onClose }: { onClose: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data.user) {
                setEmail(data.user.email || '');
            }
        };
        fetchUser();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const updates: any = {};
        if (email) updates.email = email;
        if (password) updates.password = password;

        if (Object.keys(updates).length === 0) {
            setMessage({ type: 'error', text: 'Nothing to update' });
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser(updates);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Account updated successfully. If you changed your email, please check your inbox for a confirmation link.' });
            setPassword(''); // Clear password field after update
        }
        
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="settings-modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">ACCOUNT SETTINGS</h2>
                    <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleUpdate} className="settings-form">
                    <div className="settings-input-group">
                        <label className="settings-label">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="brutal-input"
                            placeholder="your@email.com"
                        />
                    </div>
                    
                    <div className="settings-input-group">
                        <label className="settings-label">New Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="brutal-input"
                            placeholder="Leave blank to keep current"
                        />
                    </div>
                    
                    {message && (
                        <div className={`settings-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}
                    
                    <div className="settings-actions">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="settings-btn-secondary"
                        >
                            CANCEL
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="settings-btn-primary"
                        >
                            {loading ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
