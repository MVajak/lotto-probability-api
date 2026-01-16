import {BindingScope, inject, injectable} from '@loopback/core';

import type {USLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';
import {LottoNumbersBaseClient, type DateMatch, type LotteryEndpointConfig, type ParsedLottoDraw} from './LottoNumbersBaseClient';
import {findUSFormatDates} from './helpers/dateUtils';

const US_LOTTERY_BASE_URL = 'https://www.lottonumbers.com';

type USLottoType =
  | LottoType.US_POWERBALL
  | LottoType.US_MEGA_MILLIONS
  | LottoType.US_CASH4LIFE
  | LottoType.US_LOTTO_AMERICA
  | LottoType.US_LUCKY_FOR_LIFE
  | LottoType.US_CA_SUPERLOTTO
  | LottoType.US_NY_LOTTO
  | LottoType.US_TX_LOTTO;

const US_LOTTERY_ENDPOINTS: Record<USLottoType, LotteryEndpointConfig> = {
  [LottoType.US_POWERBALL]: {
    urlPath: '/powerball/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_MEGA_MILLIONS]: {
    urlPath: '/mega-millions/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_CASH4LIFE]: {
    urlPath: '/cash-4-life/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_LOTTO_AMERICA]: {
    urlPath: '/lotto-america/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_LUCKY_FOR_LIFE]: {
    urlPath: '/lucky-for-life/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_CA_SUPERLOTTO]: {
    urlPath: '/california-superlotto/numbers',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.US_NY_LOTTO]: {
    urlPath: '/new-york-lotto/numbers',
    mainCount: 6,
    supplementaryCount: 1,
  },
  [LottoType.US_TX_LOTTO]: {
    urlPath: '/lotto-texas/numbers',
    mainCount: 6,
    supplementaryCount: 0,
  },
};

/**
 * Client for fetching US lottery draws from lottonumbers.com
 * Supports: Powerball, Mega Millions, Cash4Life, Lotto America, Lucky for Life,
 *           California SuperLotto Plus, New York Lotto, Texas Lotto
 */
@injectable({scope: BindingScope.SINGLETON})
export class USLotteryClient extends LottoNumbersBaseClient<USLottoDrawDto> {
  constructor(
    @inject('services.LoggerService')
    loggerService: LoggerService,
  ) {
    super(loggerService);
  }

  protected getBaseUrl(): string {
    return US_LOTTERY_BASE_URL;
  }

  protected getEndpoints(): Record<string, LotteryEndpointConfig> {
    return US_LOTTERY_ENDPOINTS;
  }

  protected getSupportedLottoTypes(): LottoType[] {
    return [
      LottoType.US_POWERBALL,
      LottoType.US_MEGA_MILLIONS,
      LottoType.US_CASH4LIFE,
      LottoType.US_LOTTO_AMERICA,
      LottoType.US_LUCKY_FOR_LIFE,
      LottoType.US_CA_SUPERLOTTO,
      LottoType.US_NY_LOTTO,
      LottoType.US_TX_LOTTO,
    ];
  }

  protected transformParsedDraw(parsed: ParsedLottoDraw, _lottoType: LottoType): USLottoDrawDto {
    return {
      drawDate: parsed.drawDate,
      drawLabel: parsed.drawLabel,
      mainNumbers: parsed.mainNumbers,
      supplementaryNumbers: parsed.supplementaryNumbers,
    };
  }

  protected findDatesInHtml(html: string): DateMatch[] {
    return findUSFormatDates(html);
  }

  // Convenience methods for each lottery type
  async fetchPowerballDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_POWERBALL);
  }

  async fetchMegaMillionsDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_MEGA_MILLIONS);
  }

  async fetchCash4LifeDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_CASH4LIFE);
  }

  async fetchLottoAmericaDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_LOTTO_AMERICA);
  }

  async fetchLuckyForLifeDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_LUCKY_FOR_LIFE);
  }

  async fetchCASuperLottoDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_CA_SUPERLOTTO);
  }

  async fetchNYLottoDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_NY_LOTTO);
  }

  async fetchTXLottoDraws(): Promise<USLottoDrawDto[]> {
    return this.fetchDraws(LottoType.US_TX_LOTTO);
  }
}
