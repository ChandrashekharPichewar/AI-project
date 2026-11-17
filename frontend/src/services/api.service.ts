import { SavedItem, IngestPayload, IngestResponseData } from '../models/item.model';
import { RagResult, QueryPayload } from '../models/rag.model';
import { ApiResponse, HealthStatus } from '../models/api.model';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.error?.message ||
          data?.message ||
          `Request failed with status ${response.status} (${response.statusText})`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Failed to reach backend server. Please verify backend is running.');
      }
      throw err;
    }
  }

  /**
   * Ingest text or URL content
   */
  public async ingest(payload: IngestPayload): Promise<ApiResponse<IngestResponseData>> {
    return this.request<ApiResponse<IngestResponseData>>('/api/ingest', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetch all saved items
   */
  public async getItems(): Promise<ApiResponse<SavedItem[]>> {
    return this.request<ApiResponse<SavedItem[]>>('/api/items', {
      method: 'GET',
    });
  }

  /**
   * Delete saved item by ID
   */
  public async deleteItem(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Query RAG pipeline
   */
  public async query(payload: QueryPayload): Promise<ApiResponse<RagResult>> {
    return this.request<ApiResponse<RagResult>>('/api/query', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Health check
   */
  public async checkHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
