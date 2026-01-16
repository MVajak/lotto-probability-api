import {BindingScope, inject, injectable} from '@loopback/core';
import * as cheerio from 'cheerio';

import type {CanadianExtraGameDto, CanadianLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';
import {LottoNumbersBaseClient, type DateMatch, type LotteryEndpointConfig, type ParsedLottoDraw} from './LottoNumbersBaseClient';
import {findUSFormatDates, MONTH_MAP} from './helpers/dateUtils';

const CANADIAN_LOTTERY_BASE_URL = 'https://ca.lottonumbers.com';

type CanadianLottoType =
  | LottoType.CA_LOTTO_MAX
  | LottoType.CA_LOTTO_649
  | LottoType.CA_DAILY_GRAND
  | LottoType.CA_LOTTARIO
  | LottoType.CA_BC_49
  | LottoType.CA_QUEBEC_49
  | LottoType.CA_ATLANTIC_49;

const CANADIAN_LOTTERY_ENDPOINTS: Record<CanadianLottoType, LotteryEndpointConfig> = {
  [LottoType.CA_LOTTO_MAX]: {
    urlPath: '/lotto-max/numbers',
    mainCount: 7,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: [],
  },
  [LottoType.CA_LOTTO_649]: {
    urlPath: '/lotto-649/numbers',
    mainCount: 6,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: [],
  },
  [LottoType.CA_DAILY_GRAND]: {
    urlPath: '/daily-grand/numbers',
    mainCount: 5,
    supplementaryCount: 1,
    hasBonus: false,
    hasGrand: true,
    extraGames: [],
  },
  [LottoType.CA_LOTTARIO]: {
    urlPath: '/ontario/lottario/numbers',
    mainCount: 6,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['earlyBird', 'encore'],
  },
  [LottoType.CA_BC_49]: {
    urlPath: '/british-columbia/lotto-49/numbers',
    mainCount: 6,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['extra'],
  },
  [LottoType.CA_QUEBEC_49]: {
    urlPath: '/quebec/lotto-49/numbers',
    mainCount: 6,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['extra'],
  },
  [LottoType.CA_ATLANTIC_49]: {
    urlPath: '/atlantic/lotto-49/numbers',
    mainCount: 6,
    supplementaryCount: 1,
    hasBonus: true,
    hasGrand: false,
    extraGames: ['tag'],
  },
};

/**
 * Client for fetching Canadian lottery draws from ca.lottonumbers.com
 * Extends LottoNumbersBaseClient for shared HTTP fetching and caching
 *
 * Handles extra complexity:
 * - Extra games: Encore, Early Bird, Extra, Tag, Gold Ball, Guaranteed Prize
 * - Bonus vs Grand: Some have bonus numbers, Daily Grand has "Grand Number"
 */
@injectable({scope: BindingScope.SINGLETON})
export class CanadianLotteryClient extends LottoNumbersBaseClient<CanadianLottoDrawDto> {
  constructor(
    @inject('services.LoggerService')
    loggerService: LoggerService,
  ) {
    super(loggerService);
  }

  protected getBaseUrl(): string {
    return CANADIAN_LOTTERY_BASE_URL;
  }

  protected getEndpoints(): Record<string, LotteryEndpointConfig> {
    return CANADIAN_LOTTERY_ENDPOINTS;
  }

  protected getSupportedLottoTypes(): LottoType[] {
    return [
      LottoType.CA_LOTTO_MAX,
      LottoType.CA_LOTTO_649,
      LottoType.CA_DAILY_GRAND,
      LottoType.CA_LOTTARIO,
      LottoType.CA_BC_49,
      LottoType.CA_QUEBEC_49,
      LottoType.CA_ATLANTIC_49,
    ];
  }

  /**
   * Transform parsed draw to Canadian DTO
   * Note: This is not used because we override parseDrawsFromHtml entirely
   */
  protected transformParsedDraw(parsed: ParsedLottoDraw, _lottoType: LottoType): CanadianLottoDrawDto {
    return {
      drawDate: parsed.drawDate,
      drawLabel: parsed.drawLabel,
      mainNumbers: parsed.mainNumbers,
      bonusNumber: parsed.supplementaryNumbers[0],
      grandNumber: undefined,
      extraGames: undefined,
    };
  }

  protected findDatesInHtml(html: string): DateMatch[] {
    return findUSFormatDates(html);
  }

  /**
   * Override parseDrawsFromHtml to handle complex Canadian parsing with extra games
   */
  protected parseDrawsFromHtml(
    html: string,
    _lottoType: LottoType,
    endpoint: LotteryEndpointConfig,
  ): CanadianLottoDrawDto[] {
    const $ = cheerio.load(html);
    const results: CanadianLottoDrawDto[] = [];

    // Find all draw blocks - they are typically in a results container
    const drawBlocks = $('div.resultsitem, div.result-item, article.draw, .draw-result').toArray();

    // If no specific containers found, try to find draw patterns in the page
    if (drawBlocks.length === 0) {
      return this.parseDrawsAlternative($, endpoint);
    }

    for (const block of drawBlocks) {
      const draw = this.parseDrawBlock($, block, endpoint);
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
   */
  private parseDrawsAlternative(
    $: cheerio.CheerioAPI,
    endpoint: LotteryEndpointConfig,
  ): CanadianLottoDrawDto[] {
    const results: CanadianLottoDrawDto[] = [];
    const fullHtml = $.html();

    // Find dates using region-specific format
    const dateMatches = this.findDatesInHtml(fullHtml);

    // For each date found, try to extract the numbers that follow
    for (let i = 0; i < dateMatches.length; i++) {
      const {date, dateStr} = dateMatches[i];
      const startIndex = dateMatches[i].index;
      const endIndex = dateMatches[i + 1]?.index ?? fullHtml.length;
      const drawSection = fullHtml.substring(startIndex, Math.min(endIndex, startIndex + 3000));

      const draw = this.parseCanadianDrawFromSection(drawSection, date, dateStr, endpoint);
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
   * Parse a Canadian draw from a section of HTML
   * Note: Named differently from base class method to avoid signature conflict
   */
  private parseCanadianDrawFromSection(
    sectionHtml: string,
    drawDate: Date,
    drawLabel: string,
    endpoint: LotteryEndpointConfig,
  ): CanadianLottoDrawDto | null {
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

    // Early Bird - 4 numbers
    if (endpoint.extraGames?.includes('earlyBird')) {
      const earlyBirdMatch = sectionHtml.match(/Early\s*Bird:?\s*([\s\S]*?)(?:Encore:|$)/i);
      if (earlyBirdMatch) {
        const ebNumbers = this.extractNumbersFromText(earlyBirdMatch[1]);
        if (ebNumbers.length >= 4) {
          extraGames.push({type: 'earlyBird', value: ebNumbers.slice(0, 4).join(',')});
        }
      }
    }

    // Encore - 7 single digits (0-9) in <li> elements
    if (endpoint.extraGames?.includes('encore')) {
      const afterEncore = sectionHtml.split(/Encore:?\s*/i)[1];
      if (afterEncore) {
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
    if (endpoint.extraGames?.includes('extra')) {
      const afterExtra = sectionHtml.split(/Extra:?\s*/i)[1];
      if (afterExtra) {
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

    // Tag - 6 single digits in <li> elements
    if (endpoint.extraGames?.includes('tag')) {
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
   * Extract numbers from a text string
   */
  private extractNumbersFromText(text: string): number[] {
    const numbers: number[] = [];
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
    endpoint: LotteryEndpointConfig,
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

    return this.parseCanadianDrawFromSection(blockHtml, drawDate, drawLabel, endpoint);
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
