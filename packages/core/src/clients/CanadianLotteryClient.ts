import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import type {CanadianExtraGameDto, CanadianLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';

const CANADIAN_LOTTERY_BASE_URL = 'https://ca.lottonumbers.com';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Endpoint configuration for Canadian lotteries
 */
interface CanadianLotteryEndpoint {
  urlPath: string;
  mainCount: number; // Number of main numbers (before bonus)
  hasBonus: boolean; // Most lotteries have bonus, Daily Grand has "Grand Number"
  hasGrand: boolean; // Only Daily Grand
  extraGames: string[]; // Extra game labels to look for
}

type CanadianLottoType =
  | LottoType.CA_LOTTO_MAX
  | LottoType.CA_LOTTO_649
  | LottoType.CA_DAILY_GRAND
  | LottoType.CA_LOTTARIO
  | LottoType.CA_BC_49
  | LottoType.CA_QUEBEC_49
  | LottoType.CA_ATLANTIC_49;

const CANADIAN_LOTTERY_ENDPOINTS: Record<CanadianLottoType, CanadianLotteryEndpoint> = {
  [LottoType.CA_LOTTO_MAX]: {
    urlPath: '/lotto-max/numbers',
    mainCount: 7,
    hasBonus: true,
    hasGrand: false,
    extraGames: [],
  },
  [LottoType.CA_LOTTO_649]: {
    urlPath: '/lotto-649/numbers',
    mainCount: 6,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['goldBall'],
  },
  [LottoType.CA_DAILY_GRAND]: {
    urlPath: '/daily-grand/numbers',
    mainCount: 5,
    hasBonus: false,
    hasGrand: true,
    extraGames: [],
  },
  [LottoType.CA_LOTTARIO]: {
    urlPath: '/ontario/lottario/numbers',
    mainCount: 6,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['earlyBird', 'encore'],
  },
  [LottoType.CA_BC_49]: {
    urlPath: '/british-columbia/lotto-49/numbers',
    mainCount: 6,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['extra'],
  },
  [LottoType.CA_QUEBEC_49]: {
    urlPath: '/quebec/lotto-49/numbers',
    mainCount: 6,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['extra'],
  },
  [LottoType.CA_ATLANTIC_49]: {
    urlPath: '/atlantic/lotto-49/numbers',
    mainCount: 6,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['guaranteedPrize', 'tag'],
  },
};

interface CacheEntry {
  data: CanadianLottoDrawDto[];
  timestamp: number;
}

/**
 * Month name to number mapping for parsing Canadian lottery dates
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

@injectable({scope: BindingScope.SINGLETON})
export class CanadianLotteryClient {
  private cache = new Map<LottoType, CacheEntry>();
  private readonly CACHE_TTL_MS = 60000; // 1 minute

  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch draws for any Canadian lottery type
   */
  async fetchDraws(lottoType: LottoType): Promise<CanadianLottoDrawDto[]> {
    const endpoint = CANADIAN_LOTTERY_ENDPOINTS[lottoType as CanadianLottoType];
    if (!endpoint) {
      this.loggerService.log(`[${lottoType}] Unknown Canadian lottery type`);
      return [];
    }

    const now = Date.now();
    const cached = this.cache.get(lottoType);

    // Return cached data if still valid
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    const url = `${CANADIAN_LOTTERY_BASE_URL}${endpoint.urlPath}`;

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
        headers: DEFAULT_HEADERS,
        timeout: 30000,
      });

      const draws = this.parseDrawsFromHtml(response.data, lottoType, endpoint);
      this.loggerService.log(`[${lottoType}] Found ${draws.length} draws`);

      // Cache the result
      this.cache.set(lottoType, {data: draws, timestamp: now});
      return draws;
    } catch (error) {
      this.loggerService.logError({
        message: `[${lottoType}] Failed to fetch draws`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
      return [];
    }
  }

  /**
   * Parse draws from HTML page
   */
  private parseDrawsFromHtml(
    html: string,
    lottoType: LottoType,
    endpoint: CanadianLotteryEndpoint,
  ): CanadianLottoDrawDto[] {
    const $ = cheerio.load(html);
    const results: CanadianLottoDrawDto[] = [];

    // Find all draw blocks - they are typically in a results container
    // The structure shows each draw as a block with date, numbers, and extras
    const drawBlocks = $('div.resultsitem, div.result-item, article.draw, .draw-result').toArray();

    // If no specific containers found, try to find draw patterns in the page
    if (drawBlocks.length === 0) {
      // Try alternative parsing - look for date patterns followed by numbers
      return this.parseDrawsAlternative($, lottoType, endpoint);
    }

    for (const block of drawBlocks) {
      const draw = this.parseDrawBlock($, block, lottoType, endpoint);
      if (draw) {
        results.push(draw);
      }
    }

    // Sort by date ascending
    results.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());

    return results;
  }

  /**
   * Alternative parsing when specific containers aren't found
   * Parses based on the text patterns observed in the HTML
   */
  private parseDrawsAlternative(
    $: cheerio.CheerioAPI,
    lottoType: LottoType,
    endpoint: CanadianLotteryEndpoint,
  ): CanadianLottoDrawDto[] {
    const results: CanadianLottoDrawDto[] = [];

    // Get the full HTML and work with it
    const fullHtml = $.html();

    // Date pattern: just find "Month Day Year" patterns directly
    // The day name before it doesn't matter for parsing
    const datePattern = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{4})/gi;

    let match;
    const dateMatches: {index: number; date: Date; dateStr: string}[] = [];

    while ((match = datePattern.exec(fullHtml)) !== null) {
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

    // For each date found, try to extract the numbers that follow
    for (let i = 0; i < dateMatches.length; i++) {
      const {date, dateStr} = dateMatches[i];
      const startIndex = dateMatches[i].index;
      const endIndex = dateMatches[i + 1]?.index ?? fullHtml.length;
      const drawSection = fullHtml.substring(startIndex, Math.min(endIndex, startIndex + 3000)); // Limit section size

      const draw = this.parseDrawFromSection($, drawSection, date, dateStr, lottoType, endpoint);
      if (draw) {
        results.push(draw);
      }
    }

    // Deduplicate by drawLabel
    const seen = new Set<string>();
    const deduplicated = results.filter(draw => {
      if (seen.has(draw.drawLabel)) return false;
      seen.add(draw.drawLabel);
      return true;
    });

    // Sort by date ascending
    deduplicated.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());

    return deduplicated;
  }

  /**
   * Parse a draw from a section of HTML
   */
  private parseDrawFromSection(
    $: cheerio.CheerioAPI,
    sectionHtml: string,
    drawDate: Date,
    drawLabel: string,
    lottoType: LottoType,
    endpoint: CanadianLotteryEndpoint,
  ): CanadianLottoDrawDto | null {
    // Extract all numbers from the section
    // Numbers appear in <span> elements (primary method)
    const $section = cheerio.load(sectionHtml);

    // Find all numbers in span elements (main lottery numbers)
    const allNumbers: number[] = [];
    $section('span').each((_, el) => {
      const text = $section(el).text().trim();
      const num = Number.parseInt(text, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= 99) {
        allNumbers.push(num);
      }
    });

    // If no span elements found, try li elements
    if (allNumbers.length === 0) {
      $section('li').each((_, el) => {
        const text = $section(el).text().trim();
        const num = Number.parseInt(text, 10);
        if (!Number.isNaN(num) && num >= 1 && num <= 99) {
          allNumbers.push(num);
        }
      });
    }

    // Last resort: extract from raw text patterns
    if (allNumbers.length === 0) {
      const numberPattern = /\*\s*(\d+)/g;
      let numMatch;
      while ((numMatch = numberPattern.exec(sectionHtml)) !== null) {
        const num = Number.parseInt(numMatch[1], 10);
        if (!Number.isNaN(num)) {
          allNumbers.push(num);
        }
      }
    }

    // Determine main numbers and bonus/grand
    const expectedTotal = endpoint.mainCount + (endpoint.hasBonus || endpoint.hasGrand ? 1 : 0);
    if (allNumbers.length < expectedTotal) {
      return null;
    }

    const mainNumbers = allNumbers.slice(0, endpoint.mainCount);
    let bonusNumber: number | undefined;
    let grandNumber: number | undefined;

    if (endpoint.hasBonus) {
      bonusNumber = allNumbers[endpoint.mainCount];
    } else if (endpoint.hasGrand) {
      grandNumber = allNumbers[endpoint.mainCount];
    }

    // Parse extra games
    const extraGames: CanadianExtraGameDto[] = [];

    // Gold Ball - look for code pattern like "39221902-01"
    if (endpoint.extraGames.includes('goldBall')) {
      const goldBallMatch = sectionHtml.match(/Gold\s*Ball\s*(?:Number)?:?\s*\*?\*?\s*([0-9-]+)/i);
      if (goldBallMatch) {
        extraGames.push({type: 'goldBall', value: goldBallMatch[1].trim()});
      }
    }

    // Early Bird - 4 numbers
    if (endpoint.extraGames.includes('earlyBird')) {
      const earlyBirdMatch = sectionHtml.match(/Early\s*Bird:?\s*([\s\S]*?)(?:Encore:|$)/i);
      if (earlyBirdMatch) {
        const ebNumbers = this.extractNumbersFromText(earlyBirdMatch[1]);
        if (ebNumbers.length >= 4) {
          extraGames.push({type: 'earlyBird', value: ebNumbers.slice(0, 4).join(',')});
        }
      }
    }

    // Encore - 7 single digits (0-9) in <li> elements
    if (endpoint.extraGames.includes('encore')) {
      const afterEncore = sectionHtml.split(/Encore:?\s*/i)[1];
      if (afterEncore) {
        // Extract single digits from <li> tags only
        const singleDigits: number[] = [];
        const digitPattern = /<li[^>]*>\s*(\d)\s*<\/li>/gi;
        let digitMatch;
        while ((digitMatch = digitPattern.exec(afterEncore)) !== null && singleDigits.length < 7) {
          singleDigits.push(Number.parseInt(digitMatch[1], 10));
        }
        if (singleDigits.length === 7) {
          extraGames.push({type: 'encore', value: singleDigits.join(',')});
        }
      }
    }

    // Extra - varies by province (4 nums for BC, 7 digits for Quebec)
    if (endpoint.extraGames.includes('extra')) {
      const afterExtra = sectionHtml.split(/Extra:?\s*/i)[1];
      if (afterExtra) {
        // Extract numbers from <li> elements
        const extraNumbers: number[] = [];
        const numPattern = /<li[^>]*>\s*(\d+)\s*<\/li>/gi;
        let numMatch;
        while ((numMatch = numPattern.exec(afterExtra)) !== null && extraNumbers.length < 7) {
          extraNumbers.push(Number.parseInt(numMatch[1], 10));
        }
        if (extraNumbers.length > 0) {
          extraGames.push({type: 'extra', value: extraNumbers.join(',')});
        }
      }
    }

    // Guaranteed Prize - code
    if (endpoint.extraGames.includes('guaranteedPrize')) {
      const gpMatch = sectionHtml.match(/Guaranteed\s*(?:Prize)?:?\s*\*?\*?\s*([A-Z0-9-]+)/i);
      if (gpMatch) {
        extraGames.push({type: 'guaranteedPrize', value: gpMatch[1].trim()});
      }
    }

    // Tag - 6 single digits in <li> elements
    if (endpoint.extraGames.includes('tag')) {
      const afterTag = sectionHtml.split(/Tag:?\s*/i)[1];
      if (afterTag) {
        const tagDigits: number[] = [];
        const digitPattern = /<li[^>]*>\s*(\d)\s*<\/li>/gi;
        let digitMatch;
        while ((digitMatch = digitPattern.exec(afterTag)) !== null && tagDigits.length < 6) {
          tagDigits.push(Number.parseInt(digitMatch[1], 10));
        }
        if (tagDigits.length === 6) {
          extraGames.push({type: 'tag', value: tagDigits.join(',')});
        }
      }
    }

    return {
      drawDate,
      drawLabel,
      mainNumbers,
      bonusNumber,
      grandNumber,
      extraGames: extraGames.length > 0 ? extraGames : undefined,
    };
  }

  /**
   * Extract numbers from a text string (handles li elements, asterisks, etc.)
   */
  private extractNumbersFromText(text: string): number[] {
    const numbers: number[] = [];
    // Match numbers that appear after asterisks, in li tags, or standalone
    const pattern = /(?:\*\s*)?(\d+)/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const num = Number.parseInt(match[1], 10);
      if (!Number.isNaN(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }

  /**
   * Parse a single draw block
   */
  private parseDrawBlock(
    $: cheerio.CheerioAPI,
    block: Parameters<cheerio.CheerioAPI>[0],
    lottoType: LottoType,
    endpoint: CanadianLotteryEndpoint,
  ): CanadianLottoDrawDto | null {
    const $block = $(block);
    const blockHtml = $block.html() || '';
    const blockText = $block.text();

    // Try to find date in the block
    const dateMatch = blockText.match(
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{4})/i,
    );

    if (!dateMatch) {
      return null;
    }

    const monthName = dateMatch[2].toLowerCase();
    const day = Number.parseInt(dateMatch[3], 10);
    const year = Number.parseInt(dateMatch[4], 10);
    const month = MONTH_MAP[monthName];

    if (month === undefined) {
      return null;
    }

    const drawDate = new Date(Date.UTC(year, month, day));
    const drawLabel = drawDate.toISOString().split('T')[0];

    return this.parseDrawFromSection($, blockHtml, drawDate, drawLabel, lottoType, endpoint);
  }

  // Convenience methods for each lottery type
  async fetchLottoMaxDraws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_LOTTO_MAX);
  }

  async fetchLotto649Draws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_LOTTO_649);
  }

  async fetchDailyGrandDraws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_DAILY_GRAND);
  }

  async fetchLottarioDraws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_LOTTARIO);
  }

  async fetchBC49Draws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_BC_49);
  }

  async fetchQuebec49Draws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_QUEBEC_49);
  }

  async fetchAtlantic49Draws(): Promise<CanadianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.CA_ATLANTIC_49);
  }
}
