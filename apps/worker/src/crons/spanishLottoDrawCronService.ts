import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  type SpanishLotteryClient,
  type SpanishLotteryDrawDto,
  isInDateRange,
  transformBonolotoResults,
  transformElGordoResults,
  transformLaPrimitivaResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving Spanish lottery draws
 * Handles: ES_LA_PRIMITIVA, ES_BONOLOTO, ES_EL_GORDO
 */
@injectable({scope: BindingScope.SINGLETON})
export class SpanishLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.SpanishLotteryClient')
    private spanishLotteryClient: SpanishLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from Spanish lottery RSS and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.ES_LA_PRIMITIVA:
        return this.fetchLaPrimitiva(dateFrom, dateTo);
      case LottoType.ES_BONOLOTO:
        return this.fetchBonoloto(dateFrom, dateTo);
      case LottoType.ES_EL_GORDO:
        return this.fetchElGordo(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported Spanish lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * Spanish lotteries use drawLabel (date) + gameTypeName as unique key
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private fetchLaPrimitiva(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.spanishLotteryClient.fetchLaPrimitivaDraws(),
      transformLaPrimitivaResults,
      LottoType.ES_LA_PRIMITIVA,
      dateFrom,
      dateTo,
    );
  }

  private fetchBonoloto(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.spanishLotteryClient.fetchBonolotoDraws(),
      transformBonolotoResults,
      LottoType.ES_BONOLOTO,
      dateFrom,
      dateTo,
    );
  }

  private fetchElGordo(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    return this.fetchAndTransform(
      () => this.spanishLotteryClient.fetchElGordoDraws(),
      transformElGordoResults,
      LottoType.ES_EL_GORDO,
      dateFrom,
      dateTo,
    );
  }

  /**
   * Generic fetch and transform for all Spanish lotteries
   */
  private async fetchAndTransform(
    fetchFn: () => Promise<SpanishLotteryDrawDto[]>,
    transformFn: (draw: SpanishLotteryDrawDto) => TransformedDraw['results'],
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws = await fetchFn();

    return draws
      .filter(draw => isInDateRange(new Date(draw.drawDate), dateFrom, dateTo))
      .map(draw => ({
        drawDate: new Date(draw.drawDate),
        drawLabel: draw.drawDate,
        gameTypeName: lottoType,
        externalDrawId: null,
        results: transformFn(draw),
      }));
  }
}