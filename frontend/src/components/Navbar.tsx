import React from 'react';
import { Sparkles, Database, Server, RefreshCw } from 'lucide-react';
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
              Intelligent notes & web clipping with pgvector semantic search
            </p>
          </div>
        </div>

        {/* Server & Database Status */}
        <div className="flex items-center gap-2 sm:gap-4">
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
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
