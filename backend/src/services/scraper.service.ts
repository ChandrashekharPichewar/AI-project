import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
}

export class ScraperService {
  /**
   * Fetches the web page content and extracts clean text using Cheerio.
   * Strips out scripts, styles, navigation, footer, ads, and redundant whitespace.
   */
  public async scrapeUrl(targetUrl: string): Promise<ScrapedContent> {
    logger.info({ url: targetUrl }, 'Fetching URL content server-side');

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 12000,
        maxRedirects: 5,
        responseType: 'text',
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Remove unwanted elements that produce noise
      $('script, style, noscript, iframe, svg, nav, footer, header, aside, .ad, .ads, .advertisement, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

      // Extract title
      let title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text().trim() ||
                  $('h1').first().text().trim();

      if (!title) {
        try {
          const parsedUrl = new URL(targetUrl);
          title = parsedUrl.hostname + parsedUrl.pathname;
        } catch {
          title = 'Web Page';
        }
      }

      // Extract main article or body content
      let text = '';
      const articleTag = $('article');
      const mainTag = $('main');

      if (articleTag.length > 0) {
        text = articleTag.text();
      } else if (mainTag.length > 0) {
        text = mainTag.text();
      } else {
        text = $('body').text();
      }

      // Clean up whitespace: collapse multiple newlines and spaces
      text = text
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!text || text.length < 20) {
        throw new AppError(
          'Failed to extract meaningful text from URL. The page might be JavaScript-rendered or protected.',
          422
        );
      }

      logger.info({ url: targetUrl, title, textLength: text.length }, 'URL scraped successfully');

      return {
        title,
        content: text,
        url: targetUrl,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ url: targetUrl, error: error.message }, 'Failed to scrape URL');
      throw new AppError(
        `Unable to fetch URL (${error.message || 'Network error'}). Ensure the URL is accessible.`,
        400,
        { originalError: error.message }
      );
    }
  }
}

export const scraperService = new ScraperService();
