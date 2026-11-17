import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { SavedItem, IngestPayload } from '../models/item.model';

export function useInboxViewModel() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    setErrorMessage(null);
    try {
      const response = await apiService.getItems();
      if (response.success && Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load saved items');
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleIngest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setErrorMessage(inputType === 'url' ? 'Please provide a valid URL' : 'Note content cannot be empty');
      return;
    }

    if (inputType === 'url') {
      try {
        const urlObj = new URL(trimmedContent);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          setErrorMessage('URL must start with http:// or https://');
          return;
        }
      } catch {
        setErrorMessage('Please enter a valid HTTP/HTTPS URL');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: IngestPayload = {
        type: inputType,
        content: trimmedContent,
        title: title.trim() || undefined,
      };

      const res = await apiService.ingest(payload);
      if (res.success) {
        setSuccessMessage(
          inputType === 'url'
            ? `URL scraped & indexed (${res.data.chunkCount} vector chunks created)`
            : `Note indexed (${res.data.chunkCount} vector chunks created)`
        );
        // Reset form
        setContent('');
        setTitle('');
        // Refresh items list
        await fetchItems();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to ingest content');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setErrorMessage(null);
    setDeletingId(id);
    try {
      const res = await apiService.deleteItem(id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return {
    items,
    isLoadingItems,
    isSubmitting,
    deletingId,
    inputType,
    content,
    title,
    errorMessage,
    successMessage,
    setInputType,
    setContent,
    setTitle,
    handleIngest,
    handleDeleteItem,
    refreshItems: fetchItems,
    clearMessages,
  };
}
