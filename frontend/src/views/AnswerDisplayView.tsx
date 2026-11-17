import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Globe,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { RagResult, SourceCitation } from '../models/rag.model';
import { Badge } from '../components/Badge';

interface AnswerDisplayViewProps {
  result: RagResult;
  onSelectCitation: (citation: SourceCitation) => void;
}

export const AnswerDisplayView: React.FC<AnswerDisplayViewProps> = ({
  result,
  onSelectCitation,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6 animate-fadeIn">
      {/* Header and Answer meta */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">
            Grounded AI Answer
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {result.metrics.processingTimeMs}ms
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {result.metrics.retrievedChunks} chunks cited
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 px-2.5 py-1 rounded-md border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Answer Content */}
      <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-100">
        <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
          {result.answer}
        </p>
      </div>

      {/* Cited Sources & Chunks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Cited Knowledge Sources ({result.sources.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Ranked by vector cosine similarity
          </span>
        </div>

        {result.sources.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No relevant chunks exceeded similarity threshold.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.sources.map((source, idx) => {
              const similarityPercent = Math.round(source.similarity * 100);

              return (
                <div
                  key={`${source.itemId}-${source.chunkIndex}-${idx}`}
                  onClick={() => onSelectCitation(source)}
                  className="group p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-white cursor-pointer transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-1.5 rounded-md shrink-0 ${
                            source.type === 'URL'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {source.type === 'URL' ? (
                            <Globe className="w-3.5 h-3.5" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {source.title}
                        </span>
                      </div>

                      <Badge
                        variant={
                          similarityPercent >= 70
                            ? 'emerald'
                            : similarityPercent >= 40
                            ? 'indigo'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {similarityPercent}% match
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      "{source.snippet}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Part #{source.chunkIndex + 1}</span>
                    <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                      View chunk <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
