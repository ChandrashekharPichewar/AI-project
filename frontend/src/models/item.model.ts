export type ItemType = 'TEXT' | 'URL';

export interface SavedItem {
  id: string;
  type: ItemType;
  title: string | null;
  url: string | null;
  rawContent: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IngestPayload {
  type: 'text' | 'url';
  content: string;
  title?: string;
}

export interface IngestResponseData {
  id: string;
  title: string;
  type: ItemType;
  url: string | null;
  chunkCount: number;
  contentLength: number;
  createdAt: string;
}
