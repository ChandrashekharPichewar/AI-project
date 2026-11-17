import React, { useState, useEffect } from 'react';
import { Sparkles, Database, Server, RefreshCw, Key, Check, X } from 'lucide-react';
import { HealthStatus } from '../models/api.model';

interface NavbarProps {
  health: HealthStatus | null;
  isHealthy: boolean | null;
  isChecking: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  isHealthy,
  isChecking,
  onRefreshHealth,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem('gemini_api_key') || '';
    setApiKey(existing);
    setHasStoredKey(!!existing);
  }, [showKeyModal]);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setHasStoredKey(true);
    } else {
      localStorage.removeItem('gemini_api_key');
      setHasStoredKey(false);
    }
    setShowKeyModal(false);
    onRefreshHealth();
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setHasStoredKey(false);
    setShowKeyModal(false);
    onRefreshHealth();
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight">
                AI Knowledge Inbox
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                RAG Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Intelligent notes & web clipping with semantic vector search
            </p>
          </div>
        </div>

        {/* Server & LLM Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini Key Config Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure Google Gemini API Key"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              hasStoredKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasStoredKey ? 'Gemini Key: Active' : 'Set Gemini Key'}
            </span>
          </button>

          {/* Backend Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy === true
                  ? 'bg-emerald-500 ring-4 ring-emerald-100'
                  : isHealthy === false
                  ? 'bg-rose-500 ring-4 ring-rose-100'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-medium hidden md:inline">
              {isHealthy === true
                ? 'Backend Online'
                : isHealthy === false
                ? 'Backend Offline'
                : 'Connecting...'}
            </span>

            {health && (
              <span className="text-slate-400 hidden lg:inline">
                • {health.services.database.includes('postgresql') ? (
                  <span className="text-indigo-600 font-medium inline-flex items-center gap-1">
                    <Database className="w-3 h-3" /> pgvector
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                    <Server className="w-3 h-3" /> In-Memory
                  </span>
                )}
              </span>
            )}

            <button
              onClick={onRefreshHealth}
              disabled={isChecking}
              title="Refresh connection status"
              className="text-slate-400 hover:text-slate-600 ml-1 transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isChecking ? 'animate-spin text-indigo-600' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Gemini Key Config Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <h3>Google Gemini API Key</h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini has a <strong>generous 100% free tier</strong> with zero payment needed. You can get a free key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline font-medium"
              >
                Google AI Studio
              </a>
              .
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Key will be stored locally in your browser for this session and sent via secure header.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              {hasStoredKey ? (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                >
                  Clear Saved Key
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
