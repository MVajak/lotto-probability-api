import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type AustralianLotteryClient,
  type AustralianLottoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformAustralianResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving Australian lottery draws
 * Handles: AU_POWERBALL, AU_SATURDAY_LOTTO, AU_OZ_LOTTO, AU_SET_FOR_LIFE, AU_WEEKDAY_WINDFALL, AU_CASH_3, AU_SUPER_66, AU_LOTTO_STRIKE
 */
@injectable({scope: BindingScope.SINGLETON})
export class AustralianLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.AustralianLotteryClient')
    private australianLotteryClient: AustralianLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from Australian lottery and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.AU_POWERBALL:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchPowerballDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_SATURDAY_LOTTO:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchSaturdayLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_OZ_LOTTO:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchOzLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_SET_FOR_LIFE:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchSetForLifeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_WEEKDAY_WINDFALL:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchWeekdayWindfallDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_CASH_3:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchCash3Draws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_SUPER_66:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchSuper66Draws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.AU_LOTTO_STRIKE:
        return this.fetchAndTransform(
          () => this.australianLotteryClient.fetchLottoStrikeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      default:
        this.loggerService.log(`Unsupported Australian lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * Australian lotteries use drawLabel + gameTypeName as unique key
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
   * Generic fetch and transform for all Australian lotteries
   * All Australian lotteries use the same transformer
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<AustralianLottoDrawDto[]>,
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
        results: transformAustralianResults(draw),
      }));
  }
}
