import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';

// Re-export for backwards compatibility
export {MONTH_MAP} from './helpers/dateUtils';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Endpoint configuration for lotteries
 */
export interface LotteryEndpointConfig {
  urlPath: string;
  mainCount: number;
  supplementaryCount: number; // Number of bonus/supplementary numbers after main
  // Optional Canadian-specific extensions
  hasBonus?: boolean;
  hasGrand?: boolean;
  extraGames?: string[];
}

/**
 * Parsed draw data from HTML
 */
export interface ParsedLottoDraw {
  drawDate: Date;
  drawLabel: string;
  mainNumbers: number[];
  supplementaryNumbers: number[];
}

/**
 * Date match result from HTML parsing
 */
export interface DateMatch {
  index: number;
  date: Date;
  dateStr: string;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

/**
 * Abstract base client for lottonumbers.com family of sites
 * Provides shared HTML parsing logic for date extraction and number parsing
 */
export abstract class LottoNumbersBaseClient<TDraw> {
  private cache = new Map<LottoType, CacheEntry<TDraw>>();
  protected readonly CACHE_TTL_MS = 60000; // 1 minute

  protected constructor(protected loggerService: LoggerService) {}

  /**
   * Get the base URL for this region (e.g., 'https://au.lottonumbers.com')
   */
  protected abstract getBaseUrl(): string;

  /**
   * Get endpoint configurations for this region's lotteries
   */
  protected abstract getEndpoints(): Record<string, LotteryEndpointConfig>;

  /**
   * Get the lottery types supported by this client
   */
  protected abstract getSupportedLottoTypes(): LottoType[];

  /**
   * Transform parsed draw data to region-specific DTO
   */
  protected abstract transformParsedDraw(parsed: ParsedLottoDraw, lottoType: LottoType): TDraw;

  /**
   * Find dates in HTML - each region implements its own date format
   */
  protected abstract findDatesInHtml(html: string): DateMatch[];

  /**
   * Fetch draws for a lottery type
   */
  async fetchDraws(lottoType: LottoType): Promise<TDraw[]> {
    const endpoints = this.getEndpoints();
    const endpoint = endpoints[lottoType];
    if (!endpoint) {
      this.loggerService.log(`[${lottoType}] Unknown lottery type for this client`);
      return [];
    }

    const now = Date.now();
    const cached = this.cache.get(lottoType);

    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `${this.getBaseUrl()}${endpoint.urlPath}`;

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        headers: DEFAULT_HEADERS,
        timeout: 30000,
      });

      const draws = this.parseDrawsFromHtml(response.data, lottoType, endpoint);
      this.loggerService.log(`[${lottoType}] Found ${draws.length} draws`);

      this.cache.set(lottoType, {data: draws, timestamp: now});
      return draws;
    } catch (error) {
      this.loggerService.logError({
        message: `[${lottoType}] Failed to fetch draws`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
    }
  }

  /**
   * Parse draws from HTML page
   * Can be overridden by subclasses for complex parsing (e.g., Canadian extra games)
   */
  protected parseDrawsFromHtml(
    html: string,
    lottoType: LottoType,
    endpoint: LotteryEndpointConfig,
  ): TDraw[] {
    const $ = cheerio.load(html);
    const results: TDraw[] = [];
    const fullHtml = $.html();

    // Find dates using region-specific implementation
    const dateMatches = this.findDatesInHtml(fullHtml);

    // Parse each draw section
    for (let i = 0; i < dateMatches.length; i++) {
      const {date, dateStr} = dateMatches[i];
      const startIndex = dateMatches[i].index;
      const endIndex = dateMatches[i + 1]?.index ?? fullHtml.length;
      const drawSection = fullHtml.substring(startIndex, Math.min(endIndex, startIndex + 3000));

      const parsed = this.parseDrawFromSection(drawSection, date, dateStr, endpoint);
      if (parsed) {
        const draw = this.transformParsedDraw(parsed, lottoType);
        results.push(draw);
      }
    }

    // Deduplicate by drawLabel
    const seen = new Set<string>();
    const deduplicated = results.filter(draw => {
      const label = (draw as unknown as {drawLabel: string}).drawLabel;
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });

    // Sort by date ascending
    deduplicated.sort((a, b) => {
      const dateA = (a as unknown as {drawDate: Date}).drawDate;
      const dateB = (b as unknown as {drawDate: Date}).drawDate;
      return dateA.getTime() - dateB.getTime();
    });

    return deduplicated;
  }

  /**
   * Parse a draw from a section of HTML
   * Can be overridden by subclasses for complex parsing
   */
  protected parseDrawFromSection(
    sectionHtml: string,
    drawDate: Date,
    drawLabel: string,
    endpoint: LotteryEndpointConfig,
  ): ParsedLottoDraw | null {
    const $section = cheerio.load(sectionHtml);

    // Extract all numbers from li elements
    const allNumbers: number[] = [];
    $section('li').each((_, el) => {
      const text = $section(el).text().trim();
      const num = Number.parseInt(text, 10);
      if (!Number.isNaN(num) && num >= 0 && num <= 99) {
        allNumbers.push(num);
      }
    });

    // Fallback to span elements if no li elements found
    if (allNumbers.length === 0) {
      $section('span').each((_, el) => {
        const text = $section(el).text().trim();
        const num = Number.parseInt(text, 10);
        if (!Number.isNaN(num) && num >= 0 && num <= 99) {
          allNumbers.push(num);
        }
      });
    }

    const expectedTotal = endpoint.mainCount + endpoint.supplementaryCount;
    if (allNumbers.length < expectedTotal) {
      return null;
    }

    const mainNumbers = allNumbers.slice(0, endpoint.mainCount);
    const supplementaryNumbers = allNumbers.slice(
      endpoint.mainCount,
      endpoint.mainCount + endpoint.supplementaryCount,
    );

    return {
      drawDate,
      drawLabel,
      mainNumbers,
      supplementaryNumbers,
    };
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
