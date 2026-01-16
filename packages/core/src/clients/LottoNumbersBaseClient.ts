import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Month name to number mapping for parsing lottery dates
 */
const MONTH_MAP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/**
 * Endpoint configuration for lotteries
 */
export interface LotteryEndpointConfig {
  urlPath: string;
  mainCount: number;
  supplementaryCount: number; // Number of bonus/supplementary numbers after main
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
   */
  private parseDrawsFromHtml(
    html: string,
    lottoType: LottoType,
    endpoint: LotteryEndpointConfig,
  ): TDraw[] {
    const $ = cheerio.load(html);
    const results: TDraw[] = [];
    const fullHtml = $.html();

    // Date patterns:
    // - US/Canada format: "Month Day Year" (e.g., "January 15 2026")
    // - AU/UK format: "Day Month Year" or "DayOfWeek Day Month Year" (e.g., "Thursday 15 January 2026")
    const monthNames =
      'January|February|March|April|May|June|July|August|September|October|November|December';

    // Pattern 1: "Month Day Year" (US/Canada)
    const usDatePattern = new RegExp(`(${monthNames})\\s+(\\d{1,2})\\s+(\\d{4})`, 'gi');

    // Pattern 2: "Day Month Year" (AU/UK) - with optional day of week
    const auDatePattern = new RegExp(
      `(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?\\s*(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`,
      'gi',
    );

    const dateMatches: {index: number; date: Date; dateStr: string}[] = [];
    let match;

    // Try US format first
    while ((match = usDatePattern.exec(fullHtml)) !== null) {
      const monthName = match[1].toLowerCase();
      const day = Number.parseInt(match[2], 10);
      const year = Number.parseInt(match[3], 10);
      const month = MONTH_MAP[monthName];

      if (month !== undefined) {
        const date = new Date(Date.UTC(year, month, day));
        const dateStr = date.toISOString().split('T')[0];
        dateMatches.push({index: match.index, date, dateStr});
      }
    }

    // Try AU/UK format if no US format found
    if (dateMatches.length === 0) {
      while ((match = auDatePattern.exec(fullHtml)) !== null) {
        const day = Number.parseInt(match[1], 10);
        const monthName = match[2].toLowerCase();
        const year = Number.parseInt(match[3], 10);
        const month = MONTH_MAP[monthName];

        if (month !== undefined) {
          const date = new Date(Date.UTC(year, month, day));
          const dateStr = date.toISOString().split('T')[0];
          dateMatches.push({index: match.index, date, dateStr});
        }
      }
    }

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
   */
  private parseDrawFromSection(
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
