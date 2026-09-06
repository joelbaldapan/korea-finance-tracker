import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import './AuthScreen.css';

export function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            setError(error.message);
        }
        setLoading(false);
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            setError(error.message);
        } else {
            setError('Check your email for the confirmation link.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-screen-container">
            <div className="auth-theme-toggle">
                <ThemeToggle />
            </div>
            
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">LOGIN</h1>
                </div>
                
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="auth-input-group">
                        <label className="auth-label">Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="brutal-input"
                            required
                        />
                    </div>
                    
                    <div className="auth-input-group">
                        <label className="auth-label">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="brutal-input"
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}
                    
                    <div className="auth-actions">
                        <button type="submit" disabled={loading} className="auth-btn-primary">
                            {loading ? 'WAIT...' : 'SIGN IN'}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={handleSignUp} 
                            disabled={loading} 
                            className="auth-btn-secondary"
                        >
                            CREATE ACCOUNT
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
