import {BindingScope, inject, injectable} from '@loopback/core';
import * as cheerio from 'cheerio';

import type {SouthAfricanLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';
import {
  LottoNumbersBaseClient,
  type DateMatch,
  type LotteryEndpointConfig,
  type ParsedLottoDraw,
} from './LottoNumbersBaseClient';
import {findAUFormatDates} from './helpers/dateUtils';

const SOUTH_AFRICAN_LOTTERY_BASE_URL = 'https://za.lottonumbers.com';

type SouthAfricanLottoType =
  | LottoType.ZA_DAILY_LOTTO
  | LottoType.ZA_LOTTO
  | LottoType.ZA_POWERBALL;

const SOUTH_AFRICAN_LOTTERY_ENDPOINTS: Record<SouthAfricanLottoType, LotteryEndpointConfig> = {
  [LottoType.ZA_DAILY_LOTTO]: {
    urlPath: '/daily-lotto/results',
    mainCount: 5,
    supplementaryCount: 0,
  },
  [LottoType.ZA_LOTTO]: {
    urlPath: '/lotto/results',
    mainCount: 6,
    supplementaryCount: 1,
  },
  [LottoType.ZA_POWERBALL]: {
    urlPath: '/powerball/results',
    mainCount: 5,
    supplementaryCount: 1,
  },
};

/**
 * Extended parsed draw with Plus variant data
 */
interface SouthAfricanParsedDraw extends ParsedLottoDraw {
  plus1Numbers?: number[];
  plus1Supplementary?: number[];
  plus2Numbers?: number[];
  plus2Supplementary?: number[];
}

/**
 * Client for fetching South African lottery draws from za.lottonumbers.com
 * Supports: Daily Lotto, Lotto (with Plus 1 & Plus 2), Powerball (with Plus)
 */
@injectable({scope: BindingScope.SINGLETON})
export class SouthAfricanLotteryClient extends LottoNumbersBaseClient<SouthAfricanLottoDrawDto> {
  constructor(
    @inject('services.LoggerService')
    loggerService: LoggerService,
  ) {
    super(loggerService);
  }

  protected getBaseUrl(): string {
    return SOUTH_AFRICAN_LOTTERY_BASE_URL;
  }

  protected getEndpoints(): Record<string, LotteryEndpointConfig> {
    return SOUTH_AFRICAN_LOTTERY_ENDPOINTS;
  }

  protected getSupportedLottoTypes(): SouthAfricanLottoType[] {
    return [LottoType.ZA_DAILY_LOTTO, LottoType.ZA_LOTTO, LottoType.ZA_POWERBALL];
  }

  protected transformParsedDraw(
    parsed: ParsedLottoDraw,
    _lottoType: LottoType,
  ): SouthAfricanLottoDrawDto {
    const extendedParsed = parsed as SouthAfricanParsedDraw;
    return {
      drawDate: parsed.drawDate,
      drawLabel: parsed.drawLabel,
      mainNumbers: parsed.mainNumbers,
      supplementaryNumbers: parsed.supplementaryNumbers,
      plus1Numbers: extendedParsed.plus1Numbers,
      plus1Supplementary: extendedParsed.plus1Supplementary,
      plus2Numbers: extendedParsed.plus2Numbers,
      plus2Supplementary: extendedParsed.plus2Supplementary,
    };
  }

  protected findDatesInHtml(html: string): DateMatch[] {
    return findAUFormatDates(html);
  }

  /**
   * Override to extract Plus variant numbers from the same section
   * Uses specific CSS selectors for each lottery type:
   * - Daily Lotto: ul.balls (main only, no Plus stored)
   * - Lotto: ul.lotto-main, ul.plus-1, ul.plus-2
   * - Powerball: ul.balls (main), ul.pb-plus
   */
  protected parseDrawFromSection(
    sectionHtml: string,
    drawDate: Date,
    drawLabel: string,
    endpoint: LotteryEndpointConfig,
  ): SouthAfricanParsedDraw | null {
    const $section = cheerio.load(sectionHtml);

    /**
     * Extract numbers from a selector
     */
    const extractNumbersFromSelector = (selector: string): number[] => {
      const numbers: number[] = [];
      $section(selector)
        .find('li')
        .each((_, li) => {
          const text = $section(li).text().trim();
          const num = Number.parseInt(text, 10);
          if (!Number.isNaN(num) && num >= 0 && num <= 99) {
            numbers.push(num);
          }
        });
      return numbers;
    };

    /**
     * Try to find numbers using specific selectors
     */
    const findNumberGroup = (selectors: string[]): number[] | null => {
      for (const selector of selectors) {
        const nums = extractNumbersFromSelector(selector);
        if (nums.length > 0) return nums;
      }
      return null;
    };

    const expectedPerGroup = endpoint.mainCount + endpoint.supplementaryCount;

    // Try specific selectors first, then fall back to generic ul.balls
    const mainSelectors = ['ul.lotto-main', 'ul.balls:first'];
    const plus1Selectors = ['ul.plus-1', 'ul.pb-plus'];
    const plus2Selectors = ['ul.plus-2'];

    // Find main numbers
    let mainNumbers = findNumberGroup(mainSelectors);

    // Ultimate fallback: extract all li numbers
    if (!mainNumbers || mainNumbers.length < expectedPerGroup) {
      const allNumbers: number[] = [];
      $section('li').each((_, el) => {
        const text = $section(el).text().trim();
        const num = Number.parseInt(text, 10);
        if (!Number.isNaN(num) && num >= 0 && num <= 99) {
          allNumbers.push(num);
        }
      });

      if (allNumbers.length < expectedPerGroup) {
        return null;
      }

      return {
        drawDate,
        drawLabel,
        mainNumbers: allNumbers.slice(0, endpoint.mainCount),
        supplementaryNumbers: allNumbers.slice(
          endpoint.mainCount,
          endpoint.mainCount + endpoint.supplementaryCount,
        ),
      };
    }

    const result: SouthAfricanParsedDraw = {
      drawDate,
      drawLabel,
      mainNumbers: mainNumbers.slice(0, endpoint.mainCount),
      supplementaryNumbers: mainNumbers.slice(
        endpoint.mainCount,
        endpoint.mainCount + endpoint.supplementaryCount,
      ),
    };

    // Find Plus 1 numbers
    const plus1Numbers = findNumberGroup(plus1Selectors);
    if (plus1Numbers && plus1Numbers.length >= expectedPerGroup) {
      result.plus1Numbers = plus1Numbers.slice(0, endpoint.mainCount);
      result.plus1Supplementary = plus1Numbers.slice(
        endpoint.mainCount,
        endpoint.mainCount + endpoint.supplementaryCount,
      );
    }

    // Find Plus 2 numbers (Lotto only)
    const plus2Numbers = findNumberGroup(plus2Selectors);
    if (plus2Numbers && plus2Numbers.length >= expectedPerGroup) {
      result.plus2Numbers = plus2Numbers.slice(0, endpoint.mainCount);
      result.plus2Supplementary = plus2Numbers.slice(
        endpoint.mainCount,
        endpoint.mainCount + endpoint.supplementaryCount,
      );
    }

    return result;
  }

  // Convenience methods for each lottery type
  async fetchDailyLottoDraws(): Promise<SouthAfricanLottoDrawDto[]> {
    return this.fetchDraws(LottoType.ZA_DAILY_LOTTO);
  }

  async fetchLottoDraws(): Promise<SouthAfricanLottoDrawDto[]> {
    return this.fetchDraws(LottoType.ZA_LOTTO);
  }

  async fetchPowerballDraws(): Promise<SouthAfricanLottoDrawDto[]> {
    return this.fetchDraws(LottoType.ZA_POWERBALL);
  }
}
