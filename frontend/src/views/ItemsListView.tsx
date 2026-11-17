import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  RefreshCw,
  Inbox,
  Loader2,
} from 'lucide-react';
import { SavedItem } from '../models/item.model';
import { Badge } from '../components/Badge';

interface ItemsListViewProps {
  items: SavedItem[];
  isLoading: boolean;
  deletingId: string | null;
  onDeleteItem: (id: string) => void;
  onRefresh: () => void;
}

export const ItemsListView: React.FC<ItemsListViewProps> = ({
  items,
  isLoading,
  deletingId,
  onDeleteItem,
  onRefresh,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredItems = items.filter((item) => {
    const query = searchFilter.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(query);
    const contentMatch = item.rawContent.toLowerCase().includes(query);
    const urlMatch = item.url?.toLowerCase().includes(query);
    return titleMatch || contentMatch || urlMatch;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">
              Saved Knowledge
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Indexed items available for semantic RAG queries
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search filter */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter items..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && items.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-xs">Loading saved knowledge...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty State */
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">
              {searchFilter ? 'No matching items found' : 'Your knowledge inbox is empty'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              {searchFilter
                ? 'Try a different search term or clear the filter.'
                : 'Add your first note or URL using the ingestion form on the left.'}
            </p>
          </div>
        </div>
      ) : (
        /* Items List */
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        item.type === 'URL'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {item.type === 'URL' ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-slate-800 text-sm truncate">
                          {item.title || (item.url ? item.url : 'Untitled Note')}
                        </h4>
                        <Badge
                          variant={item.type === 'URL' ? 'blue' : 'indigo'}
                          size="sm"
                        >
                          {item.type}
                        </Badge>
                      </div>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-0.5 truncate max-w-md"
                        >
                          <span>{item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          {item.chunkCount} {item.chunkCount === 1 ? 'vector chunk' : 'vector chunks'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      title={isExpanded ? 'Collapse' : 'View content'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete item"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Preview */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-100">
                      {item.rawContent}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
