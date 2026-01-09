import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import axios from 'axios';

import type {
  UKEuroMillionsDrawDto,
  UKHotPicksDrawDto,
  UKLottoDrawDto,
  UKSetForLifeDrawDto,
  UKThunderballDrawDto,
} from '../models/UKLotto';
import type {LoggerService} from '../services/logger/loggerService';
import {parseCSVRows} from '../utils/csv';

export const UK_LOTTERY_BASE_URL = 'https://www.national-lottery.co.uk';

export type UKLotteryGameSlug = 'euromillions' | 'lotto' | 'thunderball' | 'set-for-life' | 'lotto-hotpicks';

@injectable({scope: BindingScope.SINGLETON})
export class UKLotteryClient {
  constructor(
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
  ) {}

  /**
   * Fetch EuroMillions draws from UK National Lottery CSV
   */
  async fetchEuroMillionsDraws(): Promise<UKEuroMillionsDrawDto[]> {
    const csv = await this.fetchCSV('euromillions');
    return this.parseEuroMillionsCSV(csv);
  }

  /**
   * Fetch Lotto draws from UK National Lottery CSV
   */
  async fetchLottoDraws(): Promise<UKLottoDrawDto[]> {
    const csv = await this.fetchCSV('lotto');
    return this.parseLottoCSV(csv);
  }

  /**
   * Fetch Thunderball draws from UK National Lottery CSV
   */
  async fetchThunderballDraws(): Promise<UKThunderballDrawDto[]> {
    const csv = await this.fetchCSV('thunderball');
    return this.parseThunderballCSV(csv);
  }

  /**
   * Fetch Set For Life draws from UK National Lottery CSV
   */
  async fetchSetForLifeDraws(): Promise<UKSetForLifeDrawDto[]> {
    const csv = await this.fetchCSV('set-for-life');
    return this.parseSetForLifeCSV(csv);
  }

  /**
   * Fetch Lotto HotPicks draws from UK National Lottery CSV
   */
  async fetchHotPicksDraws(): Promise<UKHotPicksDrawDto[]> {
    const csv = await this.fetchCSV('lotto-hotpicks');
    return this.parseHotPicksCSV(csv);
  }

  /**
   * Fetch raw CSV data from UK National Lottery website
   */
  private async fetchCSV(game: UKLotteryGameSlug): Promise<string> {
    const url = `${UK_LOTTERY_BASE_URL}/results/${game}/draw-history/csv`;

    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      this.loggerService.logError({
        message: `Failed to fetch UK lottery CSV for ${game}`,
        errorConstructor: HttpErrors.BadRequest,
      });
    }
  }

  /**
   * Parse EuroMillions CSV
   * Columns: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Lucky Star 1,Lucky Star 2,UK Millionaire Maker,DrawNumber
   */
  private parseEuroMillionsCSV(csv: string): UKEuroMillionsDrawDto[] {
    const rows = parseCSVRows(csv);

    return rows.map(cols => ({
      drawDate: cols[0],
      ball1: Number.parseInt(cols[1], 10),
      ball2: Number.parseInt(cols[2], 10),
      ball3: Number.parseInt(cols[3], 10),
      ball4: Number.parseInt(cols[4], 10),
      ball5: Number.parseInt(cols[5], 10),
      luckyStar1: Number.parseInt(cols[6], 10),
      luckyStar2: Number.parseInt(cols[7], 10),
      // cols[8] is UK Millionaire Maker (skip)
      drawNumber: Number.parseInt(cols[9], 10),
    }));
  }

  /**
   * Parse Lotto CSV
   * Columns: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Ball 6,Bonus Ball,Ball Set,Machine,Raffles,DrawNumber
   */
  private parseLottoCSV(csv: string): UKLottoDrawDto[] {
    const rows = parseCSVRows(csv);

    return rows.map(cols => ({
      drawDate: cols[0],
      ball1: Number.parseInt(cols[1], 10),
      ball2: Number.parseInt(cols[2], 10),
      ball3: Number.parseInt(cols[3], 10),
      ball4: Number.parseInt(cols[4], 10),
      ball5: Number.parseInt(cols[5], 10),
      ball6: Number.parseInt(cols[6], 10),
      bonusBall: Number.parseInt(cols[7], 10),
      // cols[8-10] are Ball Set, Machine, Raffles (skip)
      drawNumber: Number.parseInt(cols[11], 10),
    }));
  }

  /**
   * Parse Thunderball CSV
   * Columns: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Thunderball,Ball Set,Machine,DrawNumber
   */
  private parseThunderballCSV(csv: string): UKThunderballDrawDto[] {
    const rows = parseCSVRows(csv);

    return rows.map(cols => ({
      drawDate: cols[0],
      ball1: Number.parseInt(cols[1], 10),
      ball2: Number.parseInt(cols[2], 10),
      ball3: Number.parseInt(cols[3], 10),
      ball4: Number.parseInt(cols[4], 10),
      ball5: Number.parseInt(cols[5], 10),
      thunderball: Number.parseInt(cols[6], 10),
      // cols[7-8] are Ball Set, Machine (skip)
      drawNumber: Number.parseInt(cols[9], 10),
    }));
  }

  /**
   * Parse Set For Life CSV
   * Columns: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Life Ball,Ball Set,Machine,DrawNumber
   */
  private parseSetForLifeCSV(csv: string): UKSetForLifeDrawDto[] {
    const rows = parseCSVRows(csv);

    return rows.map(cols => ({
      drawDate: cols[0],
      ball1: Number.parseInt(cols[1], 10),
      ball2: Number.parseInt(cols[2], 10),
      ball3: Number.parseInt(cols[3], 10),
      ball4: Number.parseInt(cols[4], 10),
      ball5: Number.parseInt(cols[5], 10),
      lifeBall: Number.parseInt(cols[6], 10),
      // cols[7-8] are Ball Set, Machine (skip)
      drawNumber: Number.parseInt(cols[9], 10),
    }));
  }

  /**
   * Parse Lotto HotPicks CSV
   * Columns: DrawDate,Ball 1,Ball 2,Ball 3,Ball 4,Ball 5,Ball 6,Ball Set,Machine,DrawNumber
   */
  private parseHotPicksCSV(csv: string): UKHotPicksDrawDto[] {
    const rows = parseCSVRows(csv);

    return rows.map(cols => ({
      drawDate: cols[0],
      ball1: Number.parseInt(cols[1], 10),
      ball2: Number.parseInt(cols[2], 10),
      ball3: Number.parseInt(cols[3], 10),
      ball4: Number.parseInt(cols[4], 10),
      ball5: Number.parseInt(cols[5], 10),
      ball6: Number.parseInt(cols[6], 10),
      // cols[7-8] are Ball Set, Machine (skip)
      drawNumber: Number.parseInt(cols[9], 10),
    }));
  }
}
