import {BindingScope, inject, injectable} from '@loopback/core';

import type {UKLottoDrawDto} from '../models';
import type {LoggerService} from '../services/logger/loggerService';
import {LottoType} from '@lotto/shared';
import {
  LottoNumbersBaseClient,
  type DateMatch,
  type LotteryEndpointConfig,
  type ParsedLottoDraw,
} from './LottoNumbersBaseClient';
import {findUKFormatDates} from './helpers/dateUtils';

const UK_LOTTERY_BASE_URL = 'https://uk.lottonumbers.com';

type UKLottoType =
  | LottoType.EUROMILLIONS
  | LottoType.UK_LOTTO
  | LottoType.UK_THUNDERBALL
  | LottoType.UK_SET_FOR_LIFE
  | LottoType.UK_HOT_PICKS
  | LottoType.UK_49S_LUNCHTIME
  | LottoType.UK_49S_TEATIME;

const UK_LOTTERY_ENDPOINTS: Record<UKLottoType, LotteryEndpointConfig> = {
  [LottoType.EUROMILLIONS]: {
    urlPath: '/euromillions/results',
    mainCount: 5,
    supplementaryCount: 2,
  },
  [LottoType.UK_LOTTO]: {
    urlPath: '/lotto/results',
    mainCount: 6,
    supplementaryCount: 1,
  },
  [LottoType.UK_THUNDERBALL]: {
    urlPath: '/thunderball/results',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.UK_SET_FOR_LIFE]: {
    urlPath: '/set-for-life/results',
    mainCount: 5,
    supplementaryCount: 1,
  },
  [LottoType.UK_HOT_PICKS]: {
    urlPath: '/lotto-hotpicks/results',
    mainCount: 6,
    supplementaryCount: 0,
  },
  [LottoType.UK_49S_LUNCHTIME]: {
    urlPath: '/uk49s-lunchtime/results',
    mainCount: 6,
    supplementaryCount: 1,
  },
  [LottoType.UK_49S_TEATIME]: {
    urlPath: '/uk49s-teatime/results',
    mainCount: 6,
    supplementaryCount: 1,
  },
};

/**
 * Client for fetching UK lottery draws from uk.lottonumbers.com
 * Supports: EuroMillions, UK Lotto, Thunderball, Set For Life, Hot Picks, UK49s
 */
@injectable({scope: BindingScope.SINGLETON})
export class UKLotteryClient extends LottoNumbersBaseClient<UKLottoDrawDto> {
  constructor(
    @inject('services.LoggerService')
    loggerService: LoggerService,
  ) {
    super(loggerService);
  }

  protected getBaseUrl(): string {
    return UK_LOTTERY_BASE_URL;
  }

  protected getEndpoints(): Record<string, LotteryEndpointConfig> {
    return UK_LOTTERY_ENDPOINTS;
  }

  protected getSupportedLottoTypes(): UKLottoType[] {
    return [
      LottoType.EUROMILLIONS,
      LottoType.UK_LOTTO,
      LottoType.UK_THUNDERBALL,
      LottoType.UK_SET_FOR_LIFE,
      LottoType.UK_HOT_PICKS,
      LottoType.UK_49S_LUNCHTIME,
      LottoType.UK_49S_TEATIME,
    ];
  }

  protected transformParsedDraw(parsed: ParsedLottoDraw, _lottoType: LottoType): UKLottoDrawDto {
    return {
      drawDate: parsed.drawDate,
      drawLabel: parsed.drawLabel,
      mainNumbers: parsed.mainNumbers,
      supplementaryNumbers: parsed.supplementaryNumbers,
    };
  }

  protected findDatesInHtml(html: string): DateMatch[] {
    return findUKFormatDates(html);
  }

  // Convenience methods for each lottery type
  async fetchEuroMillionsDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.EUROMILLIONS);
  }

  async fetchLottoDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_LOTTO);
  }

  async fetchThunderballDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_THUNDERBALL);
  }

  async fetchSetForLifeDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_SET_FOR_LIFE);
  }

  async fetchHotPicksDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_HOT_PICKS);
  }

  async fetchUK49sLunchtimeDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_49S_LUNCHTIME);
  }

  async fetchUK49sTeatimeDraws(): Promise<UKLottoDrawDto[]> {
    return this.fetchDraws(LottoType.UK_49S_TEATIME);
  }
}
