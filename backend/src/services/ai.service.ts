import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AiService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openAiClient: OpenAI | null = null;
  private activeProvider: 'gemini' | 'openai' | 'simulation' = 'simulation';

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      this.activeProvider = 'gemini';
      logger.info('Google Gemini AI initialized with GEMINI_API_KEY (Free Tier: text-embedding-004 & gemini-1.5-flash)');
    } else if (env.OPENAI_API_KEY) {
      this.openAiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
      this.activeProvider = 'openai';
      logger.info('OpenAI client initialized with OPENAI_API_KEY');
    } else {
      this.activeProvider = 'simulation';
      logger.warn('Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured. Operating in simulated mode.');
    }
  }

  public getProviderName(): string {
    return this.activeProvider;
  }

  /**
   * Generates vector embeddings for a batch of strings.
   * Priority: Google Gemini (text-embedding-004, 768 dims) -> OpenAI (1536 dims) -> Simulation (768 dims)
   */
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    // 1. Google Gemini Embeddings (Generous Free Tier)
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
        });

        // Generate embeddings for each chunk in parallel
        const results = await Promise.all(
          texts.map(async (text) => {
            const res = await model.embedContent(text);
            return res.embedding.values;
          })
        );

        logger.debug(
          { count: results.length, dims: results[0]?.length },
          'Gemini text-embedding-004 embeddings generated'
        );
        return results;
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate embeddings from Gemini API');
        throw new AppError(`Google Gemini Embedding Error: ${error.message}`, 502);
      }
    }

    // 2. OpenAI Embeddings Fallback
    if (this.openAiClient) {
      try {
        const response = await this.openAiClient.embeddings.create({
          model: env.OPENAI_EMBEDDING_MODEL,
          input: texts,
        });
        return response.data.map((item: { embedding: number[] }) => item.embedding);
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to generate embeddings from OpenAI API');
        throw new AppError(`OpenAI Embedding Error: ${error.message}`, 502);
      }
    }

    // 3. Simulated Deterministic Embeddings Fallback (768 dims)
    logger.warn('Generating simulated 768-d embeddings (no API key configured)');
    return texts.map((t) => this.generateMockEmbedding(t, 768));
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

    // 1. Google Gemini Answer (gemini-1.5-flash)
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({
          model: env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        return result.response.text()?.trim() || 'No answer could be generated.';
      } catch (error: any) {
        logger.error({ error: error.message }, 'Gemini chat completion failed');
        throw new AppError(`Google Gemini Chat Error: ${error.message}`, 502);
      }
    }

    // 2. OpenAI GPT Answer
    if (this.openAiClient) {
      try {
        const completion = await this.openAiClient.chat.completions.create({
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

    // 3. Fallback answer when running without an API key
    if (contextChunks.length === 0) {
      return 'I could not find any relevant information in your saved notes or URLs to answer this question.';
    }

    const snippetPreview = contextChunks
      .slice(0, 2)
      .map((c, i) => `[Source ${i + 1}: ${c.sourceTitle}] "${c.content.substring(0, 160)}..."`)
      .join('\n\n');

    return `(Simulated RAG Answer - set GEMINI_API_KEY for real AI response)\n\nBased on your saved content, relevant excerpts include:\n\n${snippetPreview}`;
  }

  /**
   * Deterministic unit vector from text hashing (used when no API key is provided).
   */
  private generateMockEmbedding(text: string, dim = 768): number[] {
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = (code * 31 + i * 17) % dim;
      vec[idx] += (code % 10) / 10;
    }
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}

export const aiService = new AiService();
// Backward compatibility alias:
export const openAiService = aiService;
