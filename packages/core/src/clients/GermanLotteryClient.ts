import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';

import {LottoType} from '@lotto/shared';
import type {LoggerService} from '../services/logger/loggerService';

const GERMAN_LOTTERY_BASE_URL = 'https://services.lotto-hessen.de/spielinformationen/gewinnzahlen';

/**
 * Response type for German 6aus49 (Lotto)
 */
interface German6aus49Response {
  Datum: string; // "10.01.2026"
  Ziehung: string; // "Samstag"
  Superzahl: number; // 6
  Zahl: number[]; // [1,13,29,7,9,4]
}

/**
 * Response type for German Keno
 */
interface GermanKenoResponse {
  Datum: string; // "12.01.2026"
  Ziehung: string; // "Montag"
  Zahl: number[]; // 20 numbers
}

/**
 * Response type for German Spiel77
 */
interface GermanSpiel77Response {
  Datum: string; // "10.01.2026"
  Ziehung: string; // "Samstag"
  Zahl: string; // "5377756" (7 digits)
}

/**
 * Response type for German Super6
 */
interface GermanSuper6Response {
  Datum: string; // "10.01.2026"
  Ziehung: string; // "Samstag"
  Zahl: string; // "094626" (6 digits)
}

/**
 * Unified DTO for German lottery draws
 */
export interface GermanLotteryDrawDto {
  drawDate: Date;
  drawLabel: string; // YYYY-MM-DD format
  mainNumbers?: number[]; // For 6aus49 and Keno
  superzahl?: number; // Bonus ball for 6aus49 (0-9)
  positionalNumber?: string; // For Spiel77 and Super6 (string of digits)
}

@injectable({scope: BindingScope.SINGLETON})
export class GermanLotteryClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch Lotto 6aus49 draw
   */
  async fetch6aus49Draw(): Promise<GermanLotteryDrawDto | null> {
    return this.fetchDraw<German6aus49Response>(
      'lotto',
      LottoType.DE_LOTTO_6AUS49,
      (data) => ({
        drawDate: this.parseGermanDate(data.Datum),
        drawLabel: this.toDrawLabel(data.Datum),
        mainNumbers: data.Zahl,
        superzahl: data.Superzahl,
      }),
    );
  }

  /**
   * Fetch Keno draw
   */
  async fetchKenoDraw(): Promise<GermanLotteryDrawDto | null> {
    return this.fetchDraw<GermanKenoResponse>(
      'keno',
      LottoType.DE_KENO,
      (data) => ({
        drawDate: this.parseGermanDate(data.Datum),
        drawLabel: this.toDrawLabel(data.Datum),
        mainNumbers: data.Zahl,
      }),
    );
  }

  /**
   * Fetch Spiel77 draw (positional lottery)
   */
  async fetchSpiel77Draw(): Promise<GermanLotteryDrawDto | null> {
    return this.fetchDraw<GermanSpiel77Response>(
      'spiel77',
      LottoType.DE_SPIEL77,
      (data) => ({
        drawDate: this.parseGermanDate(data.Datum),
        drawLabel: this.toDrawLabel(data.Datum),
        positionalNumber: data.Zahl,
      }),
    );
  }

  /**
   * Fetch Super6 draw (positional lottery)
   */
  async fetchSuper6Draw(): Promise<GermanLotteryDrawDto | null> {
    return this.fetchDraw<GermanSuper6Response>(
      'super6',
      LottoType.DE_SUPER6,
      (data) => ({
        drawDate: this.parseGermanDate(data.Datum),
        drawLabel: this.toDrawLabel(data.Datum),
        positionalNumber: data.Zahl,
      }),
    );
  }

  /**
   * Generic fetch method for German lottery endpoints
   */
  private async fetchDraw<T>(
    endpoint: string,
    lottoType: LottoType,
    transform: (data: T) => GermanLotteryDrawDto,
  ): Promise<GermanLotteryDrawDto | null> {
    const url = `${GERMAN_LOTTERY_BASE_URL}/${endpoint}`;

    try {
      const response = await axios.get<T>(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LottoLens/1.0)',
          Accept: 'application/json',
        },
      });

      return transform(response.data);
    } catch (error) {
      this.loggerService.logError({
        message: `[${lottoType}] Failed to fetch draw`,
        errorConstructor: HttpErrors.BadRequest,
        data: axios.isAxiosError(error) ? error.response?.data : error,
      });
    }
  }

  /**
   * Parse German date format (DD.MM.YYYY) to Date object
   */
  private parseGermanDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  /**
   * Convert German date (DD.MM.YYYY) to drawLabel (YYYY-MM-DD)
   */
  private toDrawLabel(dateStr: string): string {
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
}
