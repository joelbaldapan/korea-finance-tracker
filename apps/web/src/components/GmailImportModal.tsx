import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import './GmailImportModal.css';

export function GmailImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('label:finances-maribank');
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isFastMode, setIsFastMode] = useState<boolean>(false);
    const queryClient = useQueryClient();
    
    const importEmails = async (accessToken: string) => {
        setLoading(true);
        setStatus('Fetching emails from Gmail...');
        
        try {
            const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            const textResponse = await listRes.text();
            let listData;
            try {
                listData = JSON.parse(textResponse);
            } catch (e) {
                setStatus(`API Error: Not JSON. Status: ${listRes.status}. Body: ${textResponse.substring(0, 100)}`);
                setLoading(false);
                return;
            }
            if (!listRes.ok || listData.error) {
                setStatus(`Gmail API Error: ${listData.error?.message || listRes.statusText}`);
                setLoading(false);
                return;
            }

            if (!listData.messages || listData.messages.length === 0) {
                setStatus('No emails found matching the query.');
                setLoading(false);
                return;
            }
            
            setStatus(`Found ${listData.messages.length} emails. Processing...`);
            
            const items = [];
            for (let i = 0; i < listData.messages.length; i++) {
                const msg = listData.messages[i];
                setStatus(`Reading email ${i + 1} of ${listData.messages.length}...`);
                
                const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const msgData = await msgRes.json();
                
                const getEmailBody = (payload: any): string => {
                    if (!payload) return '';
                    if (payload.mimeType === 'text/plain' && payload.body?.data) return payload.body.data;
                    if (payload.body?.data && !payload.parts) return payload.body.data;
                    
                    if (payload.parts) {
                        const plain = payload.parts.find((p: any) => p.mimeType === 'text/plain');
                        if (plain) return getEmailBody(plain);
                        
                        const html = payload.parts.find((p: any) => p.mimeType === 'text/html');
                        if (html) return getEmailBody(html);
                        
                        for (const part of payload.parts) {
                            const res = getEmailBody(part);
                            if (res) return res;
                        }
                    }
                    return '';
                };
                
                let bodyStr = '';
                const encodedBody = getEmailBody(msgData.payload);
                
                if (encodedBody) {
                    try {
                        const b64 = encodedBody.replace(/-/g, '+').replace(/_/g, '/');
                        bodyStr = decodeURIComponent(escape(atob(b64)));
                        // Strip HTML tags if any
                        bodyStr = bodyStr.replace(/<[^>]+>/g, ' ');
                    } catch (e) {
                        console.error('Failed to decode body:', e);
                    }
                }
                
                // Fallback to snippet if body extraction fails
                if (!bodyStr) {
                    bodyStr = msgData.snippet || '';
                }
                
                const timestamp = new Date(parseInt(msgData.internalDate)).toISOString();
                
                if (bodyStr) {
                    items.push({
                        source: 'gmail',
                        source_id: msg.id,
                        raw_body: bodyStr,
                        timestamp: timestamp,
                        device_location: null
                    });
                }
            }
            
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            
            let successCount = 0;
            const errors: string[] = [];
            for (let i = 0; i < items.length; i++) {
                setStatus(`Importing transaction ${i + 1} of ${items.length}...`);
                
                try {
                    const importRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/transactions/import`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ 
                            items: [{
                                ...items[i],
                                skip_enrichment: isFastMode
                            }] 
                        })
                    });
                    
                    const importResText = await importRes.text();
                    let importData;
                    try {
                        importData = JSON.parse(importResText);
                        if (importData.success) {
                            // Backend results array will have length 1
                            if (importData.results && importData.results[0]) {
                                if (importData.results[0].success) {
                                    successCount++;
                                } else {
                                    errors.push(importData.results[0].error || 'Unknown error');
                                }
                            }
                        } else {
                            errors.push(importData.error || 'Server error');
                        }
                    } catch (e) {
                        console.error('Not JSON', importResText);
                        errors.push(`Not JSON: ${importResText.substring(0, 50)}`);
                    }
                    
                    // Delay to prevent rate limiting (only needed if not in fast mode, but we keep a small delay just in case)
                    await new Promise(r => setTimeout(r, isFastMode ? 200 : 4500));
                } catch (e: any) {
                    console.error('Import error for item', i, e);
                    errors.push(e.message);
                }
            }
            
            let finalStatus = `Successfully imported ${successCount} out of ${items.length} transactions!`;
            if (errors.length > 0) {
                finalStatus += ` Errors: ${errors[0]}`;
                if (errors.length > 1) finalStatus += ` (and ${errors.length - 1} more)`;
            }
            setStatus(finalStatus);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        } catch (e: any) {
            console.error(e);
            setStatus(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const login = useGoogleLogin({
        onSuccess: tokenResponse => importEmails(tokenResponse.access_token),
        scope: 'https://www.googleapis.com/auth/gmail.readonly'
    });
    
    if (!isOpen) return null;
    
    return (
        <div className="gmail-modal-overlay">
            <div className="gmail-modal-content">
                <button onClick={onClose} className="gmail-modal-close" disabled={loading}>
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="gmail-modal-title">
                    <Mail className="w-6 h-6 inline mr-2" />
                    Import Gmail
                </h2>
                
                <p className="gmail-modal-desc">
                    Connect your Gmail account to automatically import past transactions.
                </p>
                
                <div className="gmail-modal-form">
                    <label className="gmail-modal-label">Search Query</label>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="brutal-input"
                        disabled={loading}
                    />
                    <p className="gmail-modal-hint">Example: label:finances-maribank</p>
                </div>
                
                <div className="gmail-import-checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <input 
                        type="checkbox" 
                        id="fastMode" 
                        checked={isFastMode}
                        onChange={(e) => setIsFastMode(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                        disabled={loading}
                    />
                    <label htmlFor="fastMode" style={{ fontSize: '0.875rem' }}>
                        <strong>Fast Mode</strong> (Skip AI Categorization)
                    </label>
                </div>

                <button 
                    onClick={() => login()} 
                    disabled={loading}
                    className="gmail-modal-btn"
                >
                    {loading ? 'Processing...' : 'Connect & Import'}
                </button>
                
                {status && (
                    <div className="gmail-modal-status">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
