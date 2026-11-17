import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class AiService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openAiClient: OpenAI | null = null;
  private isOpenAiExhausted = false;

  constructor() {
    if (env.GEMINI_API_KEY) {
      try {
        this.geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        logger.info('Google Gemini AI initialized from environment (Free Tier: text-embedding-004 & gemini-1.5-flash)');
      } catch (e: any) {
        logger.warn({ error: e.message }, 'Failed to initialize Gemini from env key');
      }
    }

    if (env.OPENAI_API_KEY) {
      try {
        this.openAiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        logger.info('OpenAI client initialized from environment');
      } catch (e: any) {
        logger.warn({ error: e.message }, 'Failed to initialize OpenAI from env key');
      }
    }
  }

  public getStatus(): string {
    if (this.geminiClient) {
      return 'Google Gemini (Free Tier: text-embedding-004 + gemini-1.5-flash)';
    }
    if (this.openAiClient && !this.isOpenAiExhausted) {
      return 'OpenAI enabled';
    }
    if (this.isOpenAiExhausted) {
      return 'Local RAG Mode (OpenAI quota depleted - add GEMINI_API_KEY for free AI)';
    }
    return 'Local Semantic Search Mode (Simulated 768-d vectors + Grounded Synthesis)';
  }

  /**
   * Helper to get or create Gemini client (either from custom key or env)
   */
  private getGeminiInstance(customApiKey?: string): GoogleGenerativeAI | null {
    if (customApiKey && customApiKey.trim().length > 0) {
      try {
        return new GoogleGenerativeAI(customApiKey.trim());
      } catch {
        return null;
      }
    }
    return this.geminiClient;
  }

  /**
   * Generates vector embeddings for a batch of strings.
   * Priority: Google Gemini (text-embedding-004, 768 dims) -> OpenAI (1536 dims) -> Simulation (768 dims)
   */
  public async generateEmbeddings(texts: string[], customApiKey?: string): Promise<number[][]> {
    if (!texts.length) return [];

    // 1. Google Gemini Embeddings (Generous Free Tier)
    const gemini = this.getGeminiInstance(customApiKey);
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
        });

        const results = await Promise.all(
          texts.map(async (text) => {
            const res = await model.embedContent(text);
            return res.embedding.values;
          })
        );

        logger.debug(
          { count: results.length, dims: results[0]?.length },
          'Gemini text-embedding-004 embeddings successfully generated'
        );
        return results;
      } catch (error: any) {
        logger.warn(
          { error: error.message },
          'Gemini embedding API call failed. Checking fallback providers...'
        );
      }
    }

    // 2. OpenAI Embeddings (if not marked exhausted)
    if (this.openAiClient && !this.isOpenAiExhausted) {
      try {
        const response = await this.openAiClient.embeddings.create({
          model: env.OPENAI_EMBEDDING_MODEL,
          input: texts,
        });
        return response.data.map((item: { embedding: number[] }) => item.embedding);
      } catch (error: any) {
        logger.warn(
          { error: error.message, status: error.status },
          'OpenAI embedding failed or quota exhausted. Marking OpenAI as exhausted.'
        );
        if (
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('credits') ||
          error.message?.includes('quota') ||
          error.message?.includes('billing')
        ) {
          this.isOpenAiExhausted = true;
        }
      }
    }

    // 3. Fallback: High-Entropy Deterministic Simulated Embeddings (768 dims)
    logger.info('Using high-entropy deterministic embeddings (local fallback mode, 768 dims)');
    return texts.map((t) => this.generateMockEmbedding(t, 768));
  }

  /**
   * Generates single embedding for a query string.
   */
  public async generateQueryEmbedding(query: string, customApiKey?: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([query], customApiKey);
    return embeddings[0];
  }

  /**
   * Generates grounded RAG answer from context chunks.
   */
  public async generateAnswer(
    query: string,
    contextChunks: { content: string; sourceTitle: string; chunkIndex: number }[],
    customApiKey?: string
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
    const gemini = this.getGeminiInstance(customApiKey);
    if (gemini) {
      try {
        const model = gemini.getGenerativeModel({
          model: env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text()?.trim();
        if (text) {
          return text;
        }
      } catch (error: any) {
        logger.warn(
          { error: error.message },
          'Gemini chat completion failed. Checking fallback providers...'
        );
      }
    }

    // 2. OpenAI GPT Answer (if not marked exhausted)
    if (this.openAiClient && !this.isOpenAiExhausted) {
      try {
        const completion = await this.openAiClient.chat.completions.create({
          model: env.OPENAI_CHAT_MODEL,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const text = completion.choices[0]?.message?.content?.trim();
        if (text) {
          return text;
        }
      } catch (error: any) {
        logger.warn(
          { error: error.message, status: error.status },
          'OpenAI chat completion failed or quota exhausted.'
        );
        if (
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('credits') ||
          error.message?.includes('quota') ||
          error.message?.includes('billing')
        ) {
          this.isOpenAiExhausted = true;
        }
      }
    }

    // 3. Fallback: Intelligent Grounded Synthesis from Context Chunks
    if (contextChunks.length === 0) {
      return 'I could not find any relevant information in your saved notes or URLs to answer this question.';
    }

    const topSnippets = contextChunks.slice(0, 3);
    const synthesis = topSnippets
      .map(
        (c, i) =>
          `**• [Source ${i + 1}: ${c.sourceTitle}]** (Part ${c.chunkIndex + 1}):\n> "${c.content.trim()}"`
      )
      .join('\n\n');

    return (
      `Here is the relevant information retrieved from your saved knowledge base regarding **"${query}"**:\n\n` +
      `${synthesis}\n\n` +
      `---\n` +
      `💡 *(Grounded answer synthesized from your knowledge chunks. To enable full Gemini generative reasoning, add your free GEMINI_API_KEY in Vercel settings or web settings.)*`
    );
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
export const openAiService = aiService;
