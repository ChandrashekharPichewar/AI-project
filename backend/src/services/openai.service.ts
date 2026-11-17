import OpenAI from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

export class OpenAiService {
  private client: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      logger.info('OpenAI client initialized with provided API key');
    } else {
      logger.warn('OPENAI_API_KEY is not set. OpenAiService will operate in simulated mode for demonstration.');
    }
  }

  /**
   * Generates 1536-dimensional embeddings for a batch of strings.
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    if (this.client) {
      try {
        const response = await this.client.embeddings.create({
          model: env.OPENAI_EMBEDDING_MODEL,
          input: texts,
        });

        return response.data.map((item) => item.embedding);
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate embeddings from OpenAI API');
        throw new AppError(`OpenAI Embedding Error: ${error.message}`, 502);
      }
    }

    // Fallback: Deterministic pseudo-embedding for testing without OpenAI API key
    logger.warn('Generating simulated 1536-d embeddings (no OPENAI_API_KEY configured)');
    return texts.map((t) => this.generateMockEmbedding(t));
  }

  /**
   * Generates single embedding for a query string.
   */
  public async generateQueryEmbedding(query: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([query]);
    return embeddings[0];
  }

  /**
   * Generates grounded RAG answer from context chunks.
   */
  public async generateAnswer(
    query: string,
    contextChunks: { content: string; sourceTitle: string; chunkIndex: number }[]
  ): Promise<string> {
    const formattedContext = contextChunks
      .map(
        (chunk, idx) =>
          `[Source ${idx + 1}: ${chunk.sourceTitle} (Part ${chunk.chunkIndex + 1})]\n${chunk.content}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = `You are an intelligent knowledge assistant for the user's "AI Knowledge Inbox".
Your job is to answer the user's question accurately and concisely using ONLY the provided context snippets from their saved notes and URLs.

Guidelines:
1. Ground your answer strictly in the provided context snippets.
2. If the context does not contain enough information to answer the question, clearly state: "I could not find relevant information in your saved notes or URLs to answer this question."
3. Cite your sources inline or at the end using the source numbers or titles (e.g. "[Source 1]").
4. Be direct, clear, and avoid conversational fluff.`;

    const userPrompt = `Context information:
---------------------
${formattedContext || 'No context available.'}
---------------------

Question: ${query}

Answer:`;

    if (this.client) {
      try {
        const completion = await this.client.chat.completions.create({
          model: env.OPENAI_CHAT_MODEL,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        return (
          completion.choices[0]?.message?.content?.trim() ||
          'No answer could be generated.'
        );
      } catch (error: any) {
        logger.error({ error: error.message }, 'OpenAI chat completion failed');
        throw new AppError(`OpenAI Completion Error: ${error.message}`, 502);
      }
    }

    // Fallback answer when running without an API key
    if (contextChunks.length === 0) {
      return "I could not find any relevant information in your saved notes or URLs to answer this question.";
    }

    const snippetPreview = contextChunks
      .slice(0, 2)
      .map((c, i) => `[Source ${i + 1}: ${c.sourceTitle}] "${c.content.substring(0, 160)}..."`)
      .join('\n\n');

    return `(Simulated RAG Answer - set OPENAI_API_KEY for GPT response)\n\nBased on your saved content, relevant excerpts include:\n\n${snippetPreview}`;
  }

  /**
   * Deterministic 1536-dimensional unit vector from text hashing (used when no API key is provided).
   */
  private generateMockEmbedding(text: string): number[] {
    const dim = 1536;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = (code * 31 + i * 17) % dim;
      vec[idx] += (code % 10) / 10;
    }
    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export const openAiService = new OpenAiService();
