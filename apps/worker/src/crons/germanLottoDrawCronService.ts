import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type GermanLotteryClient,
  type GermanLotteryDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformGerman6aus49Results,
  transformGermanKenoResults,
  transformGermanSpiel77Results,
  transformGermanSuper6Results,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving German lottery draws
 * Handles: DE_LOTTO_6AUS49, DE_KENO, DE_SPIEL77, DE_SUPER6
 *
 * Note: German lottery API only returns the latest draw (no history).
 */
@injectable({scope: BindingScope.SINGLETON})
export class GermanLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.GermanLotteryClient')
    private germanLotteryClient: GermanLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from German lottery API and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.DE_LOTTO_6AUS49:
        return this.fetch6aus49(dateFrom, dateTo);
      case LottoType.DE_KENO:
        return this.fetchKeno(dateFrom, dateTo);
      case LottoType.DE_SPIEL77:
        return this.fetchSpiel77(dateFrom, dateTo);
      case LottoType.DE_SUPER6:
        return this.fetchSuper6(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported German lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * German lotteries use drawLabel + gameTypeName as unique key
   * drawLabel is the date in YYYY-MM-DD format
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private async fetch6aus49(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const draw = await this.germanLotteryClient.fetch6aus49Draw();
    return this.transformSingleDraw(
      draw,
      transformGerman6aus49Results,
      LottoType.DE_LOTTO_6AUS49,
      dateFrom,
      dateTo,
    );
  }

  private async fetchKeno(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const draw = await this.germanLotteryClient.fetchKenoDraw();
    return this.transformSingleDraw(
      draw,
      transformGermanKenoResults,
      LottoType.DE_KENO,
      dateFrom,
      dateTo,
    );
  }

  private async fetchSpiel77(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const draw = await this.germanLotteryClient.fetchSpiel77Draw();
    return this.transformSingleDraw(
      draw,
      transformGermanSpiel77Results,
      LottoType.DE_SPIEL77,
      dateFrom,
      dateTo,
    );
  }

  private async fetchSuper6(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const draw = await this.germanLotteryClient.fetchSuper6Draw();
    return this.transformSingleDraw(
      draw,
      transformGermanSuper6Results,
      LottoType.DE_SUPER6,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Transform a single draw (German API only returns latest)
   */
  private transformSingleDraw(
    draw: GermanLotteryDrawDto | null,
    transformFn: (draw: GermanLotteryDrawDto) => TransformedDraw['results'],
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): TransformedDraw[] {
    if (!draw) return [];

    // Check if draw is within date range
    if (!isInDateRange(draw.drawDate, dateFrom, dateTo)) {
      this.loggerService.log(`[${lottoType}] Draw ${draw.drawLabel} outside date range, skipping`);
      return [];
    }

    return [
      {
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: lottoType,
        externalDrawId: null,
        results: transformFn(draw),
      },
    ];
  }
}
