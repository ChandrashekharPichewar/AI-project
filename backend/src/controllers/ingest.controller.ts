import { Request, Response, NextFunction } from 'express';
import { scraperService } from '../services/scraper.service.js';
import { chunkerService } from '../services/chunker.service.js';
import { openAiService } from '../services/openai.service.js';
import { vectorService } from '../services/vector.service.js';
import { logger } from '../config/logger.js';
import { IngestInput } from '../schemas/ingest.schema.js';

export class IngestController {
  public async handleIngest(
    req: Request<unknown, unknown, IngestInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { type, content, title: providedTitle } = req.body;
      logger.info({ type, hasCustomTitle: !!providedTitle }, 'Handling content ingestion request');

      let rawContent = content;
      let finalTitle = providedTitle || null;
      let targetUrl: string | null = null;

      if (type === 'url') {
        targetUrl = content.trim();
        const scraped = await scraperService.scrapeUrl(targetUrl);
        rawContent = scraped.content;
        finalTitle = providedTitle || scraped.title || targetUrl;
      } else {
        // Plain text note
        if (!finalTitle) {
          // Generate a sensible default title from first words
          const firstLine = rawContent.split('\n')[0].trim();
          finalTitle = firstLine.length > 50 ? `${firstLine.substring(0, 47)}...` : firstLine || 'Untitled Note';
        }
      }

      // Step 1: Chunk content with intentional boundaries
      const chunks = chunkerService.chunkText(rawContent);
      if (chunks.length === 0) {
        res.status(400).json({
          success: false,
          error: { message: 'Provided content contains no extractable text' },
        });
        return;
      }

      // Step 2: Generate Vector Embeddings (768 dims with Gemini / fallback)
      const chunkTexts = chunks.map((c) => c.content);
      const customKey =
        (req.headers['x-gemini-key'] as string) ||
        (req.body as any).geminiApiKey ||
        undefined;
      const embeddings = await openAiService.generateEmbeddings(chunkTexts, customKey);

      // Step 3: Store Item & Vector Chunks in PostgreSQL / pgvector
      const stored = await vectorService.storeItemWithChunks(
        type.toUpperCase() as 'TEXT' | 'URL',
        rawContent,
        finalTitle,
        targetUrl,
        chunks,
        embeddings
      );

      res.status(201).json({
        success: true,
        message: 'Content successfully ingested and indexed for semantic search',
        data: {
          id: stored.id,
          title: finalTitle,
          type: type.toUpperCase(),
          url: targetUrl,
          chunkCount: stored.chunkCount,
          contentLength: rawContent.length,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ingestController = new IngestController();
