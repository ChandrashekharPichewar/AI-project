import { useState } from 'react';
import { apiService } from '../services/api.service';
import { RagResult, SourceCitation } from '../models/rag.model';

export function useRagViewModel() {
  const [query, setQuery] = useState<string>('');
  const [topK, setTopK] = useState<number>(4);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [result, setResult] = useState<RagResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);

  const handleQuery = async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : query).trim();
    if (!q) {
      setErrorMessage('Please enter a question to ask your saved knowledge');
      return;
    }

    if (customQuery) {
      setQuery(customQuery);
    }

    setIsQuerying(true);
    setErrorMessage(null);

    try {
      const res = await apiService.query({ query: q, topK });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process question');
    } finally {
      setIsQuerying(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setQuery('');
    setErrorMessage(null);
    setSelectedCitation(null);
  };

  const openSourceModal = (citation: SourceCitation) => {
    setSelectedCitation(citation);
  };

  const closeSourceModal = () => {
    setSelectedCitation(null);
  };

  return {
    query,
    topK,
    isQuerying,
    result,
    errorMessage,
    selectedCitation,
    setQuery,
    setTopK,
    handleQuery,
    clearResult,
    openSourceModal,
    closeSourceModal,
    clearErrorMessage: () => setErrorMessage(null),
  };
}
