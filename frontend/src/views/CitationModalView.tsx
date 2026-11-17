import React from 'react';
import { Modal } from '../components/Modal';
import { SourceCitation } from '../models/rag.model';
import { Badge } from '../components/Badge';
import { ExternalLink, Globe, FileText } from 'lucide-react';

interface CitationModalViewProps {
  citation: SourceCitation | null;
  onClose: () => void;
}

export const CitationModalView: React.FC<CitationModalViewProps> = ({
  citation,
  onClose,
}) => {
  if (!citation) return null;

  const similarityPercent = Math.round(citation.similarity * 100);

  return (
    <Modal isOpen={!!citation} onClose={onClose} title="Cited Knowledge Chunk">
      <div className="space-y-4">
        {/* Source metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                citation.type === 'URL'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {citation.type === 'URL' ? (
                <Globe className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm text-slate-800 truncate">
                {citation.title}
              </h4>
              <p className="text-xs text-slate-400">
                Chunk #{citation.chunkIndex + 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={
                similarityPercent >= 70
                  ? 'emerald'
                  : similarityPercent >= 40
                  ? 'indigo'
                  : 'slate'
              }
            >
              Cosine Score: {citation.similarity.toFixed(4)} ({similarityPercent}%)
            </Badge>

            {citation.url && (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-white transition"
                title="Open original website"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Full Chunk Content */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Retrieved Text Chunk
          </label>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto">
            {citation.snippet}
          </div>
        </div>

        {/* Explainability note */}
        <div className="text-[11px] text-slate-400 bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg">
          <strong className="text-indigo-700">RAG Grounding:</strong> This chunk was retrieved by calculating the cosine distance between your question's vector embedding and stored document vectors in PostgreSQL (`pgvector`). It was supplied to the LLM context prompt to generate a hallucination-free answer.
        </div>
      </div>
    </Modal>
  );
};
