import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type FrenchLotteryClient,
  type FrenchLotoDrawDto,
  type FrenchKenoDrawDto,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  isInDateRange,
  transformFrenchJokerResults,
  transformFrenchKenoResults,
  transformFrenchLoto2ndResults,
  transformFrenchLotoResults,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving French lottery draws
 * Handles: FR_LOTO, FR_JOKER, FR_KENO
 *
 * Note: tirage-gagnant.com only returns the latest draw (no history).
 * FR_LOTO (including 2nd tirage with /2 suffix) and FR_JOKER are scraped from the Loto page.
 * FR_KENO and FR_JOKER (on non-Loto days) are scraped from the Keno page.
 */
@injectable({scope: BindingScope.SINGLETON})
export class FrenchLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.FrenchLotteryClient')
    private frenchLotteryClient: FrenchLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from French lottery and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.FR_LOTO:
        return this.fetchLoto(dateFrom, dateTo);
      case LottoType.FR_JOKER:
        return this.fetchJoker(dateFrom, dateTo);
      case LottoType.FR_KENO:
        return this.fetchKeno(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported French lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * French lotteries use drawLabel + gameTypeName as unique key
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private async fetchLoto(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const data = await this.frenchLotteryClient.fetchLotoDraws();
    if (!data) return [];

    const draws: TransformedDraw[] = [];

    // Main draw
    const mainDraw = this.transformLotoDraw(data, transformFrenchLotoResults, LottoType.FR_LOTO, dateFrom, dateTo);
    draws.push(...mainDraw);

    // 2nd tirage (if exists) - same type, different label with /2 suffix
    if (data.secondTirageNumbers) {
      const secondDraw = this.transformLotoDraw(
        data,
        transformFrenchLoto2ndResults,
        LottoType.FR_LOTO,
        dateFrom,
        dateTo,
        '/2',
      );
      draws.push(...secondDraw);
    }

    return draws;
  }

  private async fetchJoker(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    // Try Keno page first (daily), then Loto page (Mon/Wed/Sat)
    // Keno is daily so it always has the latest Joker number
    const kenoData = await this.frenchLotteryClient.fetchKenoDraws();
    if (kenoData?.jokerNumber) {
      return this.transformJokerFromKeno(kenoData, dateFrom, dateTo);
    }

    // Fallback to Loto page
    const lotoData = await this.frenchLotteryClient.fetchLotoDraws();
    if (lotoData?.jokerNumber) {
      return this.transformJokerDraw(lotoData, dateFrom, dateTo);
    }

    this.loggerService.log('[FR_JOKER] No Joker number found');
    return [];
  }

  private async fetchKeno(dateFrom: Date, dateTo: Date): Promise<TransformedDraw[]> {
    const data = await this.frenchLotteryClient.fetchKenoDraws();
    return this.transformKenoDraw(data, dateFrom, dateTo);
  }

  /**
   * Transform a Loto draw to common format
   */
  private transformLotoDraw(
    draw: FrenchLotoDrawDto | null,
    transformFn: (draw: FrenchLotoDrawDto) => TransformedDraw['results'],
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
    labelSuffix = '',
  ): TransformedDraw[] {
    if (!draw) return [];

    if (!isInDateRange(draw.drawDate, dateFrom, dateTo)) {
      this.loggerService.log(`[${lottoType}] Draw ${draw.drawLabel}${labelSuffix} outside date range, skipping`);
      return [];
    }

    const results = transformFn(draw);
    if (results.length === 0) return [];

    return [
      {
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel + labelSuffix,
        gameTypeName: lottoType,
        externalDrawId: null,
        results,
      },
    ];
  }

  /**
   * Transform Joker from Loto page data
   */
  private transformJokerDraw(
    draw: FrenchLotoDrawDto,
    dateFrom: Date,
    dateTo: Date,
  ): TransformedDraw[] {
    if (!isInDateRange(draw.drawDate, dateFrom, dateTo)) {
      this.loggerService.log(`[FR_JOKER] Draw ${draw.drawLabel} outside date range, skipping`);
      return [];
    }

    const results = transformFrenchJokerResults(draw.jokerNumber);
    if (results.length === 0) return [];

    return [
      {
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: LottoType.FR_JOKER,
        externalDrawId: null,
        results,
      },
    ];
  }

  /**
   * Transform Joker from Keno page data
   */
  private transformJokerFromKeno(
    draw: FrenchKenoDrawDto,
    dateFrom: Date,
    dateTo: Date,
  ): TransformedDraw[] {
    if (!isInDateRange(draw.drawDate, dateFrom, dateTo)) {
      this.loggerService.log(`[FR_JOKER] Draw ${draw.drawLabel} outside date range, skipping`);
      return [];
    }

    const results = transformFrenchJokerResults(draw.jokerNumber);
    if (results.length === 0) return [];

    return [
      {
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: LottoType.FR_JOKER,
        externalDrawId: null,
        results,
      },
    ];
  }

  /**
   * Transform Keno draw to common format
   */
  private transformKenoDraw(
    draw: FrenchKenoDrawDto | null,
    dateFrom: Date,
    dateTo: Date,
  ): TransformedDraw[] {
    if (!draw) return [];

    if (!isInDateRange(draw.drawDate, dateFrom, dateTo)) {
      this.loggerService.log(`[FR_KENO] Draw ${draw.drawLabel} outside date range, skipping`);
      return [];
    }

    return [
      {
        drawDate: draw.drawDate,
        drawLabel: draw.drawLabel,
        gameTypeName: LottoType.FR_KENO,
        externalDrawId: null,
        results: transformFrenchKenoResults(draw),
      },
    ];
  }
}