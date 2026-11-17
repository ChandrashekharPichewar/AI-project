export interface SourceCitation {
  itemId: string;
  chunkIndex: number;
  title: string;
  url?: string | null;
  type: string;
  snippet: string;
  similarity: number;
}

export interface RagResult {
  answer: string;
  sources: SourceCitation[];
  metrics: {
    retrievedChunks: number;
    processingTimeMs: number;
  };
}

export interface QueryPayload {
  query: string;
  topK?: number;
}
