import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  type SouthAfricanLotteryClient,
  type SouthAfricanLottoDrawDto,
  isInDateRange,
  transformDailyLottoResults,
  transformLottoResults,
  transformPowerballResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving South African lottery draws
 * Handles: ZA_DAILY_LOTTO, ZA_LOTTO (with Plus 1 & Plus 2), ZA_POWERBALL (with Plus)
 */
@injectable({scope: BindingScope.SINGLETON})
export class SouthAfricanLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.SouthAfricanLotteryClient')
    private southAfricanLotteryClient: SouthAfricanLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from South African lottery and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.ZA_DAILY_LOTTO:
        return this.fetchAndTransform(
          () => this.southAfricanLotteryClient.fetchDailyLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
          transformDailyLottoResults,
        );
      case LottoType.ZA_LOTTO:
        return this.fetchAndTransform(
          () => this.southAfricanLotteryClient.fetchLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
          transformLottoResults,
        );
      case LottoType.ZA_POWERBALL:
        return this.fetchAndTransform(
          () => this.southAfricanLotteryClient.fetchPowerballDraws(),
          lottoType,
          dateFrom,
          dateTo,
          transformPowerballResults,
        );
      default:
        this.loggerService.log(`Unsupported South African lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * South African lotteries use drawLabel + gameTypeName as unique key
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
   * Generic fetch and transform for all South African lotteries
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<SouthAfricanLottoDrawDto[]>,
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
    transformFn: (draw: SouthAfricanLottoDrawDto) => Array<{
      winClass: number | null;
      winningNumber: string | null;
      secWinningNumber: string | null;
    }>,
  ): Promise<TransformedDraw[]> {
    const draws = await fetchFn();

    return draws
      .filter(draw => isInDateRange(draw.drawDate, dateFrom, dateTo))
      .map(draw => ({
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: lottoType,
        externalDrawId: null,
        results: transformFn(draw),
      }));
  }
}
