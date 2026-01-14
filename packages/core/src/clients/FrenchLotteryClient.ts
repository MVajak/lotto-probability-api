import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';
import * as cheerio from 'cheerio';

import {LottoType} from '@lotto/shared';
import type {LoggerService} from '../services/logger/loggerService';

const TIRAGE_LOTO_URL = 'https://tirage-gagnant.com/loto/';
const TIRAGE_KENO_URL = 'https://tirage-gagnant.com/keno/';

/**
 * DTO for French Loto draw data
 */
export interface FrenchLotoDrawDto {
  drawDate: Date;
  drawLabel: string;
  lotoNumbers: number[]; // 5 main numbers
  chanceNumber: number; // 1-10
  secondTirageNumbers: number[] | null; // 5 numbers (optional)
  jokerNumber: string | null; // 7 digits as comma-separated "3,0,1,0,6,4,5"
}

/**
 * DTO for French Keno draw data
 */
export interface FrenchKenoDrawDto {
  drawDate: Date;
  drawLabel: string;
  kenoNumbers: number[]; // 20 numbers (pre Nov 2025) or 16 numbers (post Nov 2025)
  jokerNumber: string | null; // 7 digits as comma-separated
}

/**
 * Client for fetching French lottery results
 * Scrapes HTML from tirage-gagnant.com results pages
 *
 * Handles:
 * - FR_LOTO: 5/49 + Chance (1-10)
 * - FR_LOTO_2ND: 5/49 (Option 2nd tirage)
 * - FR_JOKER: 7 digits
 * - FR_KENO: 16/56 (since Nov 2025)
 */
@injectable({scope: BindingScope.SINGLETON})
export class FrenchLotteryClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch and parse Loto results page
   * Returns data for FR_LOTO, FR_LOTO_2ND, and FR_JOKER
   */
  async fetchLotoDraws(): Promise<FrenchLotoDrawDto | null> {
    try {
      const response = await axios.get<string>(TIRAGE_LOTO_URL, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      return this.parseLotoPage(response.data);
    } catch (error) {
      this.loggerService.logError({
        message: `[${LottoType.FR_LOTO}] Failed to fetch Loto draws`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Fetch and parse Keno results page
   * Returns data for FR_KENO and FR_JOKER
   */
  async fetchKenoDraws(): Promise<FrenchKenoDrawDto | null> {
    try {
      const response = await axios.get<string>(TIRAGE_KENO_URL, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        },
      });

      return this.parseKenoPage(response.data);
    } catch (error) {
      this.loggerService.logError({
        message: `[${LottoType.FR_KENO}] Failed to fetch Keno draws`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.message : error,
      });
      return null;
    }
  }

  /**
   * Parse Loto results page HTML from tirage-gagnant.com
   * Structure: <p class="num"> for main numbers, <p class="chance"> for chance number
   */
  private parseLotoPage(html: string): FrenchLotoDrawDto {
    const $ = cheerio.load(html);

    // Parse date from <span class="date_full"> or <span class="date_min">
    // Example: "Lundi 12 Janvier 2026" or "12/01/2026"
    let dateText = $('span.date_full').first().text().trim();
    if (!dateText) {
      dateText = $('span.date_min').first().text().trim();
    }
    if (!dateText) {
      // Fallback to searching in result date paragraph
      dateText = $('p.date').first().text();
    }
    const date = this.parseFrenchDateFromTitle(dateText);
    const drawLabel = this.formatDrawLabel(date);

    // Parse main Loto numbers from <p class="num"> elements (excluding numbis)
    const lotoNumbers: number[] = [];
    $('p.num').not('.numbis').each((_, el) => {
      const num = parseInt($(el).text().trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= 49) {
        lotoNumbers.push(num);
      }
    });

    // Parse Chance number from <p class="chance">
    let chanceNumber = 0;
    const chanceEl = $('p.chance').first();
    if (chanceEl.length > 0) {
      chanceNumber = parseInt(chanceEl.text().trim(), 10);
    }

    // Validate main numbers
    if (lotoNumbers.length < 5) {
      throw new Error(`Expected at least 5 Loto numbers, got ${lotoNumbers.length}`);
    }

    // Take first 5 numbers (in case of duplicates or extra elements)
    const mainNumbers = lotoNumbers.slice(0, 5);

    // Validate chance number
    if (chanceNumber < 1 || chanceNumber > 10) {
      throw new Error(`Chance number out of range: ${chanceNumber}`);
    }

    // Parse 2nd tirage (Option 2nd tirage) from <p class="num numbis">
    let secondTirageNumbers: number[] | null = null;
    const secondNums: number[] = [];
    $('p.num.numbis').each((_, el) => {
      const num = parseInt($(el).text().trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= 49) {
        secondNums.push(num);
      }
    });

    if (secondNums.length === 5) {
      secondTirageNumbers = secondNums;
    }

    // Parse Joker+ number from <span class="jokerbloc"> or <div class="joker">
    const jokerNumber = this.parseJokerFromHtml($, html);

    return {
      drawDate: date,
      drawLabel,
      lotoNumbers: mainNumbers,
      chanceNumber,
      secondTirageNumbers,
      jokerNumber,
    };
  }

  /**
   * Parse Keno results page HTML from tirage-gagnant.com
   */
  private parseKenoPage(html: string): FrenchKenoDrawDto {
    const $ = cheerio.load(html);

    // Parse date from <p class="date"> like "Résultat KENO du Lundi 12 Janvier 2026"
    const dateEl = $('p.date').first().text();
    const date = this.parseFrenchDateFromTitle(dateEl);
    const drawLabel = this.formatDrawLabel(date);

    // Parse Keno numbers from <p class="num"> elements within the first result section
    const kenoNumbers: number[] = [];
    $('#resultat_keno_tirage p.num').each((_, el) => {
      const num = parseInt($(el).text().trim(), 10);
      if (!isNaN(num) && num >= 1 && num <= 70) {
        kenoNumbers.push(num);
      }
    });

    // Since Nov 2025, Keno has 16 numbers (was 20 before)
    // Accept either 16 or 20 numbers for backward compatibility
    if (kenoNumbers.length < 16) {
      throw new Error(`Expected at least 16 Keno numbers, got ${kenoNumbers.length}`);
    }

    // Take the drawn numbers (16 for new format, 20 for old)
    const drawnNumbers = kenoNumbers.length >= 20 ? kenoNumbers.slice(0, 20) : kenoNumbers.slice(0, 16);

    // Parse Joker+
    const jokerNumber = this.parseJokerFromHtml($, html);

    return {
      drawDate: date,
      drawLabel,
      kenoNumbers: drawnNumbers,
      jokerNumber,
    };
  }

  /**
   * Parse Joker+ number from HTML
   * Formats:
   * - Loto page: <span class="jokerbloc">3</span>... (individual spans)
   * - Keno page: <div class="joker"><span class="green">Joker+</span>3 010 645</div>
   */
  private parseJokerFromHtml($: cheerio.CheerioAPI, html: string): string | null {
    // Try to find jokerbloc spans (Loto page format)
    const jokerBlocs = $('span.jokerbloc');
    if (jokerBlocs.length >= 7) {
      const digits: string[] = [];
      jokerBlocs.each((_, el) => {
        const digit = $(el).text().trim();
        if (/^\d$/.test(digit)) {
          digits.push(digit);
        }
      });

      if (digits.length === 7) {
        return digits.join(',');
      }
    }

    // Try div.joker (Keno page format: "Joker+3 010 645")
    const jokerDiv = $('div.joker, p.joker').first();
    if (jokerDiv.length > 0) {
      // Get full text and extract digits after "Joker+"
      const fullText = jokerDiv.text();
      const afterJoker = fullText.replace(/.*Joker\+?\s*/i, '');
      const rawJoker = afterJoker.replace(/\s/g, '');

      if (rawJoker.length >= 7 && /^\d+/.test(rawJoker)) {
        const digits = rawJoker.substring(0, 7);
        if (/^\d{7}$/.test(digits)) {
          return digits.split('').join(',');
        }
      }
    }

    // Fallback: search for Joker pattern in raw HTML
    const jokerMatch = html.match(/Joker\+?[®]?\s*<\/span>\s*([\d\s]{7,})/i);
    if (jokerMatch) {
      const rawJoker = jokerMatch[1].replace(/\s/g, '');
      if (rawJoker.length >= 7 && /^\d+$/.test(rawJoker)) {
        return rawJoker.substring(0, 7).split('').join(',');
      }
    }

    return null;
  }

  /**
   * Parse French date from title text
   * Supports formats:
   * - "tirage Loto du lundi 13 janvier 2026"
   * - "tirage du 13/01/2026"
   * - "13 janvier 2026"
   */
  private parseFrenchDateFromTitle(titleText: string): Date {
    // Try DD/MM/YYYY format first
    const slashMatch = titleText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const day = parseInt(slashMatch[1], 10);
      const month = parseInt(slashMatch[2], 10) - 1;
      const year = parseInt(slashMatch[3], 10);
      return new Date(Date.UTC(year, month, day, 19, 0, 0));
    }

    // Try "DD month YYYY" format
    const frenchMonths: Record<string, number> = {
      janvier: 0,
      février: 1,
      fevrier: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      août: 7,
      aout: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      décembre: 11,
      decembre: 11,
    };

    const textMatch = titleText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthName = textMatch[2].toLowerCase();
      const year = parseInt(textMatch[3], 10);

      const month = frenchMonths[monthName];
      if (month !== undefined) {
        return new Date(Date.UTC(year, month, day, 19, 0, 0));
      }
    }

    throw new Error(`Failed to parse French date from title: ${titleText}`);
  }

  /**
   * Format date as YYYY-MM-DD for drawLabel
   */
  private formatDrawLabel(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
