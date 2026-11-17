import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { IngestFormView } from './views/IngestFormView';
import { ItemsListView } from './views/ItemsListView';
import { RagQueryView } from './views/RagQueryView';
import { AnswerDisplayView } from './views/AnswerDisplayView';
import { CitationModalView } from './views/CitationModalView';
import { useInboxViewModel } from './viewmodels/useInboxViewModel';
import { useRagViewModel } from './viewmodels/useRagViewModel';
import { useHealthViewModel } from './viewmodels/useHealthViewModel';
import { Layers, Sparkles, Inbox, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'both' | 'inbox' | 'ask'>('both');

  // ViewModels
  const inboxVm = useInboxViewModel();
  const ragVm = useRagViewModel();
  const healthVm = useHealthViewModel();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        health={healthVm.health}
        isHealthy={healthVm.isHealthy}
        isChecking={healthVm.isChecking}
        onRefreshHealth={healthVm.recheckHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs for Mobile / Screen Size Switch */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('both')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'both'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Split View
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'inbox'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Knowledge Ingestion ({inboxVm.items.length})
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ask'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI & RAG
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Postgres + pgvector • Express • Cheerio • Google Gemini</span>
          </div>
        </div>

        {/* Dynamic Layout Based on Tab Selection */}
        <div
          className={`grid gap-6 ${
            activeTab === 'both'
              ? 'grid-cols-1 lg:grid-cols-12'
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}
        >
          {/* Left Column: Ingestion & Saved Items */}
          {(activeTab === 'both' || activeTab === 'inbox') && (
            <div
              className={`space-y-6 ${
                activeTab === 'both' ? 'lg:col-span-5' : 'w-full'
              }`}
            >
              <IngestFormView
                inputType={inboxVm.inputType}
                content={inboxVm.content}
                title={inboxVm.title}
                isSubmitting={inboxVm.isSubmitting}
                errorMessage={inboxVm.errorMessage}
                successMessage={inboxVm.successMessage}
                setInputType={inboxVm.setInputType}
                setContent={inboxVm.setContent}
                setTitle={inboxVm.setTitle}
                onSubmit={inboxVm.handleIngest}
                onClearMessages={inboxVm.clearMessages}
              />

              <ItemsListView
                items={inboxVm.items}
                isLoading={inboxVm.isLoadingItems}
                deletingId={inboxVm.deletingId}
                onDeleteItem={inboxVm.handleDeleteItem}
                onRefresh={inboxVm.refreshItems}
              />
            </div>
          )}

          {/* Right Column: Semantic Search & Grounded Answers */}
          {(activeTab === 'both' || activeTab === 'ask') && (
            <div
              className={`space-y-6 ${
                activeTab === 'both' ? 'lg:col-span-7' : 'w-full'
              }`}
            >
              <RagQueryView
                query={ragVm.query}
                topK={ragVm.topK}
                isQuerying={ragVm.isQuerying}
                errorMessage={ragVm.errorMessage}
                hasResult={!!ragVm.result}
                setQuery={ragVm.setQuery}
                setTopK={ragVm.setTopK}
                onSubmit={ragVm.handleQuery}
                onClear={ragVm.clearResult}
                onClearError={ragVm.clearErrorMessage}
              />

              {ragVm.result && (
                <AnswerDisplayView
                  result={ragVm.result}
                  onSelectCitation={ragVm.openSourceModal}
                />
              )}

              {/* Helpful Explainer Card if no search has run yet */}
              {!ragVm.result && !ragVm.isQuerying && (
                <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Retrieval Augmented Generation (RAG)
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Save your notes or URLs on the left. When you enter a question above, our vector pipeline retrieves the most relevant chunks using pgvector cosine distance, supplies them into the prompt, and generates a cited answer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Citation Detail Modal */}
      <CitationModalView
        citation={ragVm.selectedCitation}
        onClose={ragVm.closeSourceModal}
      />
    </div>
  );
}
