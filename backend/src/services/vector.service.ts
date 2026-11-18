import { getPrismaClient, isDatabaseHealthy, ensureDatabaseConnected } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { VectorSearchResult, ChunkMetadata, ItemType } from '../types/index.js';
import crypto from 'crypto';

interface InMemoryChunk {
  id: string;
  itemId: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
  createdAt: Date;
}

interface InMemoryItem {
  id: string;
  type: ItemType;
  title: string | null;
  url: string | null;
  rawContent: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VectorService {
  // In-memory fallback structures if database is not connected
  private memoryItems: Map<string, InMemoryItem> = new Map();
  private memoryChunks: InMemoryChunk[] = [];

  /**
   * Stores an item and its associated vector chunks.
   */
  public async storeItemWithChunks(
    type: ItemType,
    rawContent: string,
    title: string | null,
    url: string | null,
    chunks: ChunkMetadata[],
    embeddings: number[][]
  ): Promise<{ id: string; chunkCount: number }> {
    const itemId = crypto.randomUUID();

    await ensureDatabaseConnected();
    if (isDatabaseHealthy()) {
      const prisma = getPrismaClient();

      try {
        // Create Item in PostgreSQL
        await prisma.item.create({
          data: {
            id: itemId,
            type,
            title,
            url,
            rawContent,
          },
        });

        // Store Chunks with pgvector embeddings
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];
          const chunkId = crypto.randomUUID();
          const vectorStr = `[${embedding.join(',')}]`;

          await prisma.$executeRawUnsafe(
            `INSERT INTO document_chunks (id, "itemId", "chunkIndex", content, embedding, "createdAt")
             VALUES ($1, $2, $3, $4, $5::vector, NOW());`,
            chunkId,
            itemId,
            chunk.chunkIndex,
            chunk.content,
            vectorStr
          );
        }

        logger.info(
          { itemId, chunkCount: chunks.length },
          'Stored item and vector embeddings in PostgreSQL + pgvector'
        );

        return { id: itemId, chunkCount: chunks.length };
      } catch (err: any) {
        logger.error({ err: err.message }, 'Failed to save to PostgreSQL, falling back to memory store');
      }
    }

    // In-memory fallback
    const now = new Date();
    this.memoryItems.set(itemId, {
      id: itemId,
      type,
      title,
      url,
      rawContent,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < chunks.length; i++) {
      this.memoryChunks.push({
        id: crypto.randomUUID(),
        itemId,
        chunkIndex: chunks[i].chunkIndex,
        content: chunks[i].content,
        embedding: embeddings[i],
        createdAt: now,
      });
    }

    logger.info(
      { itemId, chunkCount: chunks.length },
      'Stored item and vector embeddings in in-memory store'
    );

    return { id: itemId, chunkCount: chunks.length };
  }

  /**
   * Performs semantic vector similarity search using cosine distance.
   */
  public async searchSimilarChunks(
    queryEmbedding: number[],
    topK = 4
  ): Promise<VectorSearchResult[]> {
    await ensureDatabaseConnected();
    if (isDatabaseHealthy()) {
      try {
        const prisma = getPrismaClient();
        const vectorStr = `[${queryEmbedding.join(',')}]`;

        // 1 - (embedding <=> vector) computes cosine similarity where 1 is identical
        const results = await prisma.$queryRawUnsafe<any[]>(
          `SELECT
             c.id,
             c."itemId",
             c."chunkIndex",
             c.content,
             i.title,
             i.url,
             i.type,
             (1 - (c.embedding <=> $1::vector)) AS similarity
           FROM document_chunks c
           JOIN items i ON c."itemId" = i.id
           WHERE c.embedding IS NOT NULL
           ORDER BY c.embedding <=> $1::vector ASC
           LIMIT $2;`,
          vectorStr,
          topK
        );

        return results.map((r) => ({
          id: r.id,
          itemId: r.itemId,
          chunkIndex: r.chunkIndex,
          content: r.content,
          title: r.title,
          url: r.url,
          type: r.type,
          similarity: Number(r.similarity),
        }));
      } catch (error: any) {
        logger.error({ error: error.message }, 'PostgreSQL vector query failed, falling back to memory search');
      }
    }

    // In-memory cosine similarity search
    const scored = this.memoryChunks.map((chunk) => {
      const item = this.memoryItems.get(chunk.itemId);
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        id: chunk.id,
        itemId: chunk.itemId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        title: item?.title || null,
        url: item?.url || null,
        type: item?.type || 'TEXT',
        similarity,
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * Retrieves all items with their chunk counts.
   */
  public async getAllItems(): Promise<any[]> {
    await ensureDatabaseConnected();
    if (isDatabaseHealthy()) {
      try {
        const prisma = getPrismaClient();
        const items = await prisma.item.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { chunks: true },
            },
          },
        });

        return items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          url: item.url,
          rawContent: item.rawContent,
          chunkCount: item._count.chunks,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }));
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch items from PostgreSQL');
      }
    }

    // Memory fallback
    const items = Array.from(this.memoryItems.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return items.map((item) => {
      const chunkCount = this.memoryChunks.filter((c) => c.itemId === item.id).length;
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        url: item.url,
        rawContent: item.rawContent,
        chunkCount,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });
  }

  /**
   * Deletes an item and its associated chunks.
   */
  public async deleteItem(id: string): Promise<boolean> {
    await ensureDatabaseConnected();
    if (isDatabaseHealthy()) {
      try {
        const prisma = getPrismaClient();
        await prisma.item.delete({ where: { id } });
        return true;
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to delete item from PostgreSQL');
      }
    }

    const existed = this.memoryItems.delete(id);
    this.memoryChunks = this.memoryChunks.filter((c) => c.itemId !== id);
    return existed;
  }

  /**
   * Calculates cosine similarity between two numeric vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorService = new VectorService();
