import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type CanadianLotteryClient,
  type CanadianLottoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformAtlantic49Results,
  transformBC49Results,
  transformDailyGrandResults,
  transformLotto649Results,
  transformLottarioResults,
  transformLottoMaxResults,
  transformQuebec49Results,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving Canadian lottery draws
 * Handles: CA_LOTTO_MAX, CA_LOTTO_649, CA_DAILY_GRAND, CA_LOTTARIO, CA_BC_49, CA_QUEBEC_49, CA_ATLANTIC_49
 */
@injectable({scope: BindingScope.SINGLETON})
export class CanadianLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.CanadianLotteryClient')
    private canadianLotteryClient: CanadianLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from Canadian lottery and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.CA_LOTTO_MAX:
        return this.fetchLottoMax(dateFrom, dateTo);
      case LottoType.CA_LOTTO_649:
        return this.fetchLotto649(dateFrom, dateTo);
      case LottoType.CA_DAILY_GRAND:
        return this.fetchDailyGrand(dateFrom, dateTo);
      case LottoType.CA_LOTTARIO:
        return this.fetchLottario(dateFrom, dateTo);
      case LottoType.CA_BC_49:
        return this.fetchBC49(dateFrom, dateTo);
      case LottoType.CA_QUEBEC_49:
        return this.fetchQuebec49(dateFrom, dateTo);
      case LottoType.CA_ATLANTIC_49:
        return this.fetchAtlantic49(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported Canadian lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * Canadian lotteries use drawLabel + gameTypeName as unique key
   * drawLabel is the date in YYYY-MM-DD format
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private fetchLottoMax(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchLottoMaxDraws(),
      transformLottoMaxResults,
      LottoType.CA_LOTTO_MAX,
      dateFrom,
      dateTo,
    );
  }

  private fetchLotto649(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchLotto649Draws(),
      transformLotto649Results,
      LottoType.CA_LOTTO_649,
      dateFrom,
      dateTo,
    );
  }

  private fetchDailyGrand(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchDailyGrandDraws(),
      transformDailyGrandResults,
      LottoType.CA_DAILY_GRAND,
      dateFrom,
      dateTo,
    );
  }

  private fetchLottario(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchLottarioDraws(),
      transformLottarioResults,
      LottoType.CA_LOTTARIO,
      dateFrom,
      dateTo,
    );
  }

  private fetchBC49(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchBC49Draws(),
      transformBC49Results,
      LottoType.CA_BC_49,
      dateFrom,
      dateTo,
    );
  }

  private fetchQuebec49(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchQuebec49Draws(),
      transformQuebec49Results,
      LottoType.CA_QUEBEC_49,
      dateFrom,
      dateTo,
    );
  }

  private fetchAtlantic49(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.canadianLotteryClient.fetchAtlantic49Draws(),
      transformAtlantic49Results,
      LottoType.CA_ATLANTIC_49,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Generic fetch and transform for all Canadian lotteries
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<CanadianLottoDrawDto[]>,
    transformFn: (draw: CanadianLottoDrawDto) => TransformedDraw['results'],
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
        results: transformFn(draw),
      }));
  }
}
