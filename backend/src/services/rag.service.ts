import { openAiService } from './openai.service.js';
import { vectorService } from './vector.service.js';
import { logger } from '../config/logger.js';
import { QueryResponse, SourceCitation } from '../types/index.js';

export class RagService {
  /**
   * Executes RAG workflow:
   * Query Embedding -> pgvector similarity search -> Context synthesis -> LLM Generation with citations
   */
  public async executeRagQuery(query: string, topK = 4): Promise<QueryResponse> {
    const startTime = Date.now();
    logger.info({ query, topK }, 'Executing RAG query pipeline');

    // 1. Generate Query Vector Embedding
    const queryEmbedding = await openAiService.generateQueryEmbedding(query);

    // 2. Retrieve Top-K Semantically Similar Chunks
    const similarChunks = await vectorService.searchSimilarChunks(queryEmbedding, topK);

    logger.info(
      { query, retrievedCount: similarChunks.length },
      'Retrieved nearest vector chunks'
    );

    // 3. Prepare Context for LLM
    const contextForLlm = similarChunks.map((chunk) => ({
      content: chunk.content,
      sourceTitle: chunk.title || (chunk.url ? chunk.url : 'Untitled Note'),
      chunkIndex: chunk.chunkIndex,
    }));

    // 4. Generate Grounded Answer via OpenAI GPT
    const answer = await openAiService.generateAnswer(query, contextForLlm);

    // 5. Structure Cited Sources
    const sources: SourceCitation[] = similarChunks.map((chunk) => ({
      itemId: chunk.itemId,
      chunkIndex: chunk.chunkIndex,
      title: chunk.title || (chunk.url ? chunk.url : 'Untitled Note'),
      url: chunk.url,
      type: chunk.type,
      snippet: chunk.content.length > 250 ? `${chunk.content.substring(0, 250)}...` : chunk.content,
      similarity: Number(chunk.similarity.toFixed(4)),
    }));

    const processingTimeMs = Date.now() - startTime;

    return {
      answer,
      sources,
      metrics: {
        retrievedChunks: similarChunks.length,
        processingTimeMs,
      },
    };
  }
}

export const ragService = new RagService();
