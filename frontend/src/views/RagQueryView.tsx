import React from 'react';
import { Search, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { Alert } from '../components/Alert';

interface RagQueryViewProps {
  query: string;
  topK: number;
  isQuerying: boolean;
  errorMessage: string | null;
  hasResult: boolean;
  setQuery: (q: string) => void;
  setTopK: (k: number) => void;
  onSubmit: (customQuery?: string) => void;
  onClear: () => void;
  onClearError: () => void;
}

export const RagQueryView: React.FC<RagQueryViewProps> = ({
  query,
  topK,
  isQuerying,
  errorMessage,
  hasResult,
  setQuery,
  setTopK,
  onSubmit,
  onClear,
  onClearError,
}) => {
  const suggestions = [
    'What are the main concepts covered in my notes?',
    'Summarize the key points from the saved URLs',
    'What architecture patterns are recommended?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Semantic RAG Query
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask natural language questions over your indexed knowledge
          </p>
        </div>

        {/* Top-K Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="topKSelect" className="text-slate-500 font-medium hidden sm:inline">
            Top Chunks:
          </label>
          <select
            id="topKSelect"
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            disabled={isQuerying}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value={2}>2 chunks</option>
            <option value={4}>4 chunks (Recommended)</option>
            <option value={6}>6 chunks</option>
            <option value={8}>8 chunks</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <Alert type="error" message={errorMessage} onClose={onClearError} />
      )}

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute left-3.5 top-3.5 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <textarea
            rows={2}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isQuerying}
            placeholder="Ask anything about your saved notes or scraped websites..."
            className="w-full pl-11 pr-24 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            {hasResult && (
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title="Clear results"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={isQuerying || !query.trim()}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isQuerying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400">Try:</span>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSubmit(s)}
              disabled={isQuerying}
              className="text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition truncate max-w-xs"
            >
              "{s}"
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
