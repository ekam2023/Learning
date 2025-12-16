import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Save, Lock, Globe, Loader2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
    const [oauthUrl, setOauthUrl] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const settings = await storageService.getAdminSettings();
            setOauthUrl(settings.oauthUrl || '');
        };
        load();
    }, []);

    const handleSave = async () => {
        setIsLoading(true);
        await storageService.saveAdminSettings({ oauthUrl });
        setIsLoading(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-neon-purple shadow-lg shadow-neon-purple/10">
                    <Lock size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Admin Settings</h2>
                    <p className="text-slate-400 mt-1">Configure global application parameters and integrations.</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/5 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Globe className="text-blue-400" size={24} />
                        <h3 className="text-xl font-bold text-white">OAuth 2.0 Configuration</h3>
                    </div>

                    <div className="max-w-2xl">
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Authorization URL
                        </label>
                        <div className="relative group">
                            <input 
                                type="url" 
                                value={oauthUrl}
                                onChange={(e) => setOauthUrl(e.target.value)}
                                placeholder="https://auth.example.com/oauth2/authorize"
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-600 focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all font-mono text-sm"
                            />
                            <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none group-hover:ring-white/20 transition-all"></div>
                        </div>
                        <p className="text-sm text-slate-500 mt-3 flex items-center gap-2">
                            This URL is used to initiate the OAuth 2.0 authorization flow for user authentication.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center gap-4">
                        <button 
                            onClick={handleSave}
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-200 ${
                                isSaved 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/20 scale-105' 
                                : isLoading
                                ? 'bg-slate-700 text-slate-400 cursor-wait'
                                : 'bg-white text-black hover:bg-slate-200'
                            }`}
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isLoading ? 'Saving...' : isSaved ? 'Settings Saved' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};