import React from 'react';
import { FileText, Globe, Plus, Loader2 } from 'lucide-react';
import { Alert } from '../components/Alert';

interface IngestFormViewProps {
  inputType: 'text' | 'url';
  content: string;
  title: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  setInputType: (type: 'text' | 'url') => void;
  setContent: (content: string) => void;
  setTitle: (title: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearMessages: () => void;
}

export const IngestFormView: React.FC<IngestFormViewProps> = ({
  inputType,
  content,
  title,
  isSubmitting,
  errorMessage,
  successMessage,
  setInputType,
  setContent,
  setTitle,
  onSubmit,
  onClearMessages,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Ingest Knowledge
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Save raw text notes or web URLs to be chunked, embedded, and indexed
          </p>
        </div>

        {/* Ingest Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setInputType('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              inputType === 'text'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Plain Note
          </button>
          <button
            type="button"
            onClick={() => setInputType('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              inputType === 'url'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Web URL
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <Alert type="error" message={errorMessage} onClose={onClearMessages} />
      )}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={onClearMessages}
        />
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Title <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <input
            type="text"
            placeholder={
              inputType === 'url'
                ? 'e.g., PostgreSQL Best Practices Guide'
                : 'e.g., Project Planning Notes'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              {inputType === 'url' ? 'Webpage URL *' : 'Note Content *'}
            </label>
            {inputType === 'text' && (
              <span className="text-xs text-slate-400">
                {content.length} characters
              </span>
            )}
          </div>

          {inputType === 'url' ? (
            <input
              type="url"
              required
              placeholder="https://example.com/article"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400"
            />
          ) : (
            <textarea
              rows={5}
              required
              placeholder="Paste notes, article excerpts, meeting summaries, or documentation here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition placeholder:text-slate-400 resize-y"
            />
          )}

          <p className="text-[11px] text-slate-400 mt-1.5">
            {inputType === 'url'
              ? 'Our server-side Cheerio scraper strips scripts & ads, then extracts meaningful article text.'
              : 'Our semantic chunker automatically segments text into overlapping windows (~750 chars) for vector search.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {inputType === 'url'
                  ? 'Fetching, Chunking & Embedding...'
                  : 'Chunking & Embedding...'}
              </span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>{inputType === 'url' ? 'Scrape & Ingest URL' : 'Save & Index Note'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
