import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type USLotteryClient,
  type USLottoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformUSLotteryResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving US lottery draws
 * Handles: US_POWERBALL, US_MEGA_MILLIONS, US_CASH4LIFE, US_LOTTO_AMERICA,
 *          US_LUCKY_FOR_LIFE, US_CA_SUPERLOTTO, US_NY_LOTTO, US_TX_LOTTO
 */
@injectable({scope: BindingScope.SINGLETON})
export class USLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.USLotteryClient')
    private usLotteryClient: USLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from lottonumbers.com and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.US_POWERBALL:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchPowerballDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_MEGA_MILLIONS:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchMegaMillionsDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_CASH4LIFE:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchCash4LifeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_LOTTO_AMERICA:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchLottoAmericaDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_LUCKY_FOR_LIFE:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchLuckyForLifeDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_CA_SUPERLOTTO:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchCASuperLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_NY_LOTTO:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchNYLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      case LottoType.US_TX_LOTTO:
        return this.fetchAndTransform(
          () => this.usLotteryClient.fetchTXLottoDraws(),
          lottoType,
          dateFrom,
          dateTo,
        );
      default:
        this.loggerService.log(`Unsupported US lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * US lotteries use drawLabel + gameTypeName as unique key
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
   * Generic fetch and transform for all US lotteries
   * All US lotteries use the same transformer
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<USLottoDrawDto[]>,
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
        results: transformUSLotteryResults(draw),
      }));
  }
}
