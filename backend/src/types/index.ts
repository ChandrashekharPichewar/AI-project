export type ItemType = 'TEXT' | 'URL';

export interface IngestRequestBody {
  type: 'text' | 'url';
  content: string;
  title?: string;
}

export interface QueryRequestBody {
  query: string;
  topK?: number;
}

export interface ChunkMetadata {
  chunkIndex: number;
  content: string;
}

export interface VectorSearchResult {
  id: string;
  itemId: string;
  chunkIndex: number;
  content: string;
  title?: string | null;
  url?: string | null;
  type: string;
  similarity: number;
}

export interface SourceCitation {
  itemId: string;
  chunkIndex: number;
  title: string;
  url?: string | null;
  type: string;
  snippet: string;
  similarity: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceCitation[];
  metrics: {
    retrievedChunks: number;
    processingTimeMs: number;
  };
}

export interface SavedItemDto {
  id: string;
  type: ItemType;
  title: string | null;
  url: string | null;
  rawContent: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}
