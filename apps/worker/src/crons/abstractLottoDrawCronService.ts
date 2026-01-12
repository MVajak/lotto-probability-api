import {BindingScope, injectable} from '@loopback/core';
import {IsolationLevel} from '@loopback/repository';
import type {LoggerService, LottoDrawResultService, LottoDrawService} from '@lotto/core';
import {
  type LottoDraw,
  LottoDrawCreateDto,
  LottoDrawResultCreateDto,
  type PostgresDataSource,
} from '@lotto/database';
import {type LottoType, config} from '@lotto/shared';
import {chunk} from 'lodash';

/**
 * Common interface for transformed draw data
 * Both Estonian and US services transform their API responses to this format
 */
export interface TransformedDraw {
  drawDate: Date;
  drawLabel: string;
  gameTypeName: LottoType;
  externalDrawId: string | null;
  results: Array<{
    winClass: number | null;
    winningNumber: string | null;
    secWinningNumber: string | null;
  }>;
}

/**
 * Abstract base class using Template Method pattern
 *
 * Provides common save logic for lotto draws while allowing subclasses
 * to implement source-specific fetching and transformation.
 */
@injectable({scope: BindingScope.SINGLETON})
export abstract class AbstractLottoDrawCronService {
  protected constructor(
    protected dataSource: PostgresDataSource,
    protected loggerService: LoggerService,
    protected lottoDrawService: LottoDrawService,
    protected lottoDrawResultService: LottoDrawResultService,
  ) {}

  /**
   * Template method - common save flow for all lottery sources
   *
   * 1. Get date range (use provided or default to recent draws)
   * 2. Fetch and transform draws (source-specific)
   * 3. Save to database (shared logic)
   *
   * @param lottoType - The lottery type to fetch
   * @param dateRange - Optional date range override (used by reset operations for full history)
   */
  async saveLatestDraws(
    lottoType: LottoType,
    dateRange?: {dateFrom: Date; dateTo: Date},
  ): Promise<void> {
    const {dateFrom, dateTo} = dateRange ?? this.getDefaultDateRange();

    this.loggerService.log(
      `[${lottoType}] Getting new draws between ${dateFrom.toISOString()} - ${dateTo.toISOString()}`,
    );

    const transformedDraws = await this.fetchAndTransformDraws(lottoType, dateFrom, dateTo);

    if (!transformedDraws.length) {
      this.loggerService.log(`[${lottoType}] No draws fetched. Closing...`);
      return;
    }

    await this.saveLottoData(transformedDraws);
  }

  // /**
  //  * Get the default date range for regular cron fetches
  //  * Returns last 5 years - TEMPORARY
  //  */
  // protected getDefaultDateRange(): {dateFrom: Date; dateTo: Date} {
  //   const now = new Date();
  //   const fiveYearsAgo = new Date(now);
  //   fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  //   return {dateFrom: fiveYearsAgo, dateTo: now};
  // }

  protected getDefaultDateRange(): {dateFrom: Date; dateTo: Date} {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {dateFrom: twentyFourHoursAgo, dateTo: now};
  }

  /**
   * Fetch draws from the source API and transform to common format
   * Each subclass implements source-specific fetching and transformation
   */
  protected abstract fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]>;

  /**
   * Build a unique lookup key for matching draws from API to database
   * Estonian uses externalDrawId, US uses date-based drawLabel
   */
  protected abstract buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string;

  /**
   * Shared save logic - handles transaction, chunking, and upserts
   * This is ~90% identical between Estonian and US services
   */
  protected async saveLottoData(transformedDraws: TransformedDraw[]): Promise<void> {
    const lottoType = transformedDraws[0].gameTypeName;
    const transaction = await this.dataSource.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      // Create draw DTOs
      const drawCreateDtos = transformedDraws.map(
        draw =>
          new LottoDrawCreateDto({
            drawDate: draw.drawDate,
            externalDrawId: draw.externalDrawId,
            gameTypeName: draw.gameTypeName,
            drawLabel: draw.drawLabel,
          }),
      );

      // Upsert draws - ON CONFLICT DO NOTHING
      const newlyInsertedDraws: LottoDraw[] = [];
      const drawChunks = chunk(drawCreateDtos, config.repository.chunkSize);
      for (const chunkedItems of drawChunks) {
        const savedDraws = await this.lottoDrawService.upsertAll(chunkedItems, {transaction});
        newlyInsertedDraws.push(...savedDraws);
      }

      const newDrawsCount = newlyInsertedDraws.length;

      // Fetch ALL draws from DB that match the ones from API
      // IMPORTANT: Use the same transaction so we can see the rows we just inserted
      const allDrawsFromDB = await this.lottoDrawService.find(
        {
          where: {
            or: transformedDraws.map(draw => ({
              drawLabel: draw.drawLabel,
              gameTypeName: draw.gameTypeName,
            })),
          },
        },
        {transaction},
      );

      // Create map for quick lookup using subclass-specific key
      const drawsMap = new Map(
        allDrawsFromDB.map(draw => [
          this.buildLookupKey({
            drawLabel: draw.drawLabel,
            gameTypeName: draw.gameTypeName,
            externalDrawId: draw.externalDrawId,
          }),
          draw,
        ]),
      );

      // Create draw results from all matching draws
      const drawResults: LottoDrawResultCreateDto[] = [];
      for (const draw of transformedDraws) {
        const key = this.buildLookupKey({
          drawLabel: draw.drawLabel,
          gameTypeName: draw.gameTypeName,
          externalDrawId: draw.externalDrawId,
        });
        const matchingDraw = drawsMap.get(key);

        if (!matchingDraw) continue;

        for (const result of draw.results) {
          // Skip results with null winningNumber (required by DB schema)
          if (!result.winningNumber) continue;

          drawResults.push(
            new LottoDrawResultCreateDto({
              winClass: result.winClass,
              winningNumber: result.winningNumber,
              secWinningNumber: result.secWinningNumber,
              drawId: matchingDraw.id,
            }),
          );
        }
      }

      // Upsert results - ON CONFLICT DO NOTHING
      let newResultsCount = 0;
      if (drawResults.length) {
        const resultChunks = chunk(drawResults, config.repository.chunkSize);
        for (const chunkedItems of resultChunks) {
          const insertedResults = await this.lottoDrawResultService.upsertAll(chunkedItems, {
            transaction,
          });
          newResultsCount += insertedResults.length;
        }
      }

      await transaction.commit();

      // Log summary
      if (newDrawsCount > 0 || newResultsCount > 0) {
        this.loggerService.log(
          `[${lottoType}] Inserted ${newDrawsCount} draws, ${newResultsCount} results`,
        );
      } else {
        this.loggerService.log(`[${lottoType}] Already up to date`);
      }
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
