import { logger } from '../config/logger.js';
import { ChunkMetadata } from '../types/index.js';

export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
}

export class ChunkerService {
  private defaultMaxChunkSize = 750;
  private defaultOverlap = 120;

  /**
   * Splits text into overlapping semantic chunks.
   * Prioritizes sentence and punctuation boundaries to preserve meaning.
   */
  public chunkText(text: string, options?: ChunkOptions): ChunkMetadata[] {
    const maxSize = options?.maxChunkSize || this.defaultMaxChunkSize;
    const overlap = options?.overlap || this.defaultOverlap;

    const cleanedText = text.trim();
    if (!cleanedText) {
      return [];
    }

    if (cleanedText.length <= maxSize) {
      return [
        {
          chunkIndex: 0,
          content: cleanedText,
        },
      ];
    }

    const chunks: ChunkMetadata[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanedText.length) {
      let endIndex = startIndex + maxSize;

      if (endIndex >= cleanedText.length) {
        // Last chunk
        const chunkContent = cleanedText.substring(startIndex).trim();
        if (chunkContent.length > 0) {
          chunks.push({
            chunkIndex,
            content: chunkContent,
          });
        }
        break;
      }

      // Look for natural boundary near endIndex:
      // Search backwards up to overlap distance for punctuation or newline
      const searchWindow = cleanedText.substring(startIndex, endIndex);
      const boundaryRegex = /(?:\. |\? |\! |\n\n|\n)/g;
      let lastMatchIndex = -1;
      let match: RegExpExecArray | null;

      while ((match = boundaryRegex.exec(searchWindow)) !== null) {
        if (match.index > maxSize * 0.4) {
          // Avoid cutting too early in the chunk
          lastMatchIndex = match.index + match[0].length;
        }
      }

      if (lastMatchIndex !== -1) {
        endIndex = startIndex + lastMatchIndex;
      } else {
        // Fallback: look for space boundary
        const lastSpace = searchWindow.lastIndexOf(' ');
        if (lastSpace > maxSize * 0.5) {
          endIndex = startIndex + lastSpace + 1;
        }
      }

      const chunkContent = cleanedText.substring(startIndex, endIndex).trim();
      if (chunkContent.length > 0) {
        chunks.push({
          chunkIndex,
          content: chunkContent,
        });
        chunkIndex++;
      }

      // Slide start index forward, accounting for overlap
      const nextStart = endIndex - overlap;
      startIndex = nextStart > startIndex ? nextStart : endIndex;
    }

    logger.debug(
      { textLength: cleanedText.length, totalChunks: chunks.length },
      'Text chunking completed'
    );

    return chunks;
  }
}

export const chunkerService = new ChunkerService();
