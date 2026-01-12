import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type IrishLotteryClient,
  type IrishLottoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformIrishLottoResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving Irish lottery draws
 * Handles: IE_LOTTO, IE_LOTTO_PLUS_1, IE_LOTTO_PLUS_2, IE_DAILY_MILLION, IE_DAILY_MILLION_PLUS
 */
@injectable({scope: BindingScope.SINGLETON})
export class IrishLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.IrishLotteryClient')
    private irishLotteryClient: IrishLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from Irish lottery and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.IE_LOTTO:
        return this.fetchIrishLotto(dateFrom, dateTo);
      case LottoType.IE_LOTTO_PLUS_1:
        return this.fetchIrishLottoPlus1(dateFrom, dateTo);
      case LottoType.IE_LOTTO_PLUS_2:
        return this.fetchIrishLottoPlus2(dateFrom, dateTo);
      case LottoType.IE_DAILY_MILLION:
        return this.fetchDailyMillion(dateFrom, dateTo);
      case LottoType.IE_DAILY_MILLION_PLUS:
        return this.fetchDailyMillionPlus(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported Irish lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * Irish lotteries use drawLabel + gameTypeName as unique key
   * drawLabel is the date in YYYY-MM-DD format
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private fetchIrishLotto(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.irishLotteryClient.fetchIrishLottoDraws(),
      transformIrishLottoResults,
      LottoType.IE_LOTTO,
      dateFrom,
      dateTo,
    );
  }

  private fetchIrishLottoPlus1(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.irishLotteryClient.fetchIrishLottoPlus1Draws(),
      transformIrishLottoResults,
      LottoType.IE_LOTTO_PLUS_1,
      dateFrom,
      dateTo,
    );
  }

  private fetchIrishLottoPlus2(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.irishLotteryClient.fetchIrishLottoPlus2Draws(),
      transformIrishLottoResults,
      LottoType.IE_LOTTO_PLUS_2,
      dateFrom,
      dateTo,
    );
  }

  private fetchDailyMillion(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.irishLotteryClient.fetchDailyMillionDraws(),
      transformIrishLottoResults,
      LottoType.IE_DAILY_MILLION,
      dateFrom,
      dateTo,
    );
  }

  private fetchDailyMillionPlus(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.irishLotteryClient.fetchDailyMillionPlusDraws(),
      transformIrishLottoResults,
      LottoType.IE_DAILY_MILLION_PLUS,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Generic fetch and transform for all Irish lotteries
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<IrishLottoDrawDto[]>,
    transformFn: (draw: IrishLottoDrawDto) => TransformedDraw['results'],
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
