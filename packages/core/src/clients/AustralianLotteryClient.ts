import {BindingScope, inject, injectable} from '@loopback/core';

import type {AustralianLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';
import {LottoNumbersBaseClient, type LotteryEndpointConfig, type ParsedLottoDraw} from './LottoNumbersBaseClient';

const AUSTRALIAN_LOTTERY_BASE_URL = 'https://au.lottonumbers.com';

type AustralianLottoType =
  | LottoType.AU_POWERBALL
  | LottoType.AU_SATURDAY_LOTTO
  | LottoType.AU_OZ_LOTTO
  | LottoType.AU_SET_FOR_LIFE
  | LottoType.AU_WEEKDAY_WINDFALL
  | LottoType.AU_CASH_3
  | LottoType.AU_SUPER_66
  | LottoType.AU_LOTTO_STRIKE;

const AUSTRALIAN_LOTTERY_ENDPOINTS: Record<AustralianLottoType, LotteryEndpointConfig> = {
  [LottoType.AU_POWERBALL]: {
    urlPath: '/powerball/results',
    mainCount: 7,
    supplementaryCount: 1, // Powerball
  },
  [LottoType.AU_SATURDAY_LOTTO]: {
    urlPath: '/saturday-lotto/results',
    mainCount: 6,
    supplementaryCount: 2,
  },
  [LottoType.AU_OZ_LOTTO]: {
    urlPath: '/oz-lotto/results',
    mainCount: 7,
    supplementaryCount: 3,
  },
  [LottoType.AU_SET_FOR_LIFE]: {
    urlPath: '/set-for-life/results',
    mainCount: 7,
    supplementaryCount: 2,
  },
  [LottoType.AU_WEEKDAY_WINDFALL]: {
    urlPath: '/weekday-windfall/results',
    mainCount: 6,
    supplementaryCount: 2,
  },
  [LottoType.AU_CASH_3]: {
    urlPath: '/cash-3/results',
    mainCount: 3,
    supplementaryCount: 0,
  },
  [LottoType.AU_SUPER_66]: {
    urlPath: '/super66/results',
    mainCount: 6,
    supplementaryCount: 0,
  },
  [LottoType.AU_LOTTO_STRIKE]: {
    urlPath: '/lotto-strike/results',
    mainCount: 4,
    supplementaryCount: 0,
  },
};

/**
 * Client for fetching Australian lottery draws from au.lottonumbers.com
 * Supports: Powerball, Saturday Lotto, Oz Lotto, Set for Life, Weekday Windfall, Cash 3, Super 66, Lotto Strike
 */
@injectable({scope: BindingScope.SINGLETON})
export class AustralianLotteryClient extends LottoNumbersBaseClient<AustralianLottoDrawDto> {
  constructor(
    @inject('services.LoggerService')
    loggerService: LoggerService,
  ) {
    super(loggerService);
  }

  protected getBaseUrl(): string {
    return AUSTRALIAN_LOTTERY_BASE_URL;
  }

  protected getEndpoints(): Record<string, LotteryEndpointConfig> {
    return AUSTRALIAN_LOTTERY_ENDPOINTS;
  }

  protected getSupportedLottoTypes(): LottoType[] {
    return [
      LottoType.AU_POWERBALL,
      LottoType.AU_SATURDAY_LOTTO,
      LottoType.AU_OZ_LOTTO,
      LottoType.AU_SET_FOR_LIFE,
      LottoType.AU_WEEKDAY_WINDFALL,
      LottoType.AU_CASH_3,
      LottoType.AU_SUPER_66,
      LottoType.AU_LOTTO_STRIKE,
    ];
  }

  protected transformParsedDraw(parsed: ParsedLottoDraw, _lottoType: LottoType): AustralianLottoDrawDto {
    return {
      drawDate: parsed.drawDate,
      drawLabel: parsed.drawLabel,
      mainNumbers: parsed.mainNumbers,
      supplementaryNumbers: parsed.supplementaryNumbers,
    };
  }

  // Convenience methods for each lottery type
  async fetchPowerballDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_POWERBALL);
  }

  async fetchSaturdayLottoDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_SATURDAY_LOTTO);
  }

  async fetchOzLottoDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_OZ_LOTTO);
  }

  async fetchSetForLifeDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_SET_FOR_LIFE);
  }

  async fetchWeekdayWindfallDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_WEEKDAY_WINDFALL);
  }

  async fetchCash3Draws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_CASH_3);
  }

  async fetchSuper66Draws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_SUPER_66);
  }

  async fetchLottoStrikeDraws(): Promise<AustralianLottoDrawDto[]> {
    return this.fetchDraws(LottoType.AU_LOTTO_STRIKE);
  }
}
