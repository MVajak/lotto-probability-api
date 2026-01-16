import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type UKLotteryClient,
  type UKLottoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformUKLotteryResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving UK lottery draws
 * Handles: EUROMILLIONS, UK_LOTTO, UK_THUNDERBALL, UK_SET_FOR_LIFE, UK_HOT_PICKS,
 *          UK_49S_LUNCHTIME, UK_49S_TEATIME
 */
@injectable({scope: BindingScope.SINGLETON})
export class UKLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.UKLotteryClient')
    private ukLotteryClient: UKLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from uk.lottonumbers.com and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.EUROMILLIONS:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchEuroMillionsDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_LOTTO:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_THUNDERBALL:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchThunderballDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_SET_FOR_LIFE:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchSetForLifeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_HOT_PICKS:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchHotPicksDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_49S_LUNCHTIME:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchUK49sLunchtimeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_49S_TEATIME:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchUK49sTeatimeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      default:
        this.loggerService.log(`Unsupported UK lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * UK lotteries use drawLabel + gameTypeName as unique key
   * drawLabel is the date in YYYY-MM-DD format
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  /**
   * Generic fetch and transform for all UK lotteries
   * All UK lotteries use the same transformer
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<UKLottoDrawDto[]>,
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws = await fetchFn();

    return draws
      .filter(draw => isInDateRange(draw.drawDate, dateFrom, dateTo))
      .map(draw => ({
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: lottoType,
        externalDrawId: null,
        results: transformUKLotteryResults(draw),
      }));
  }
}
