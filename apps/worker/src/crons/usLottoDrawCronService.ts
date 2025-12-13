import {BindingScope, inject, injectable} from '@loopback/core';
import {
  type Cash4LifeDrawDto,
  type DataNYGovClient,
  type LoggerService,
  type LottoDrawResultService,
  type LottoDrawService,
  type MegaMillionsDrawDto,
  type PowerballDrawDto,
  generateUSLottoDrawLabel,
  parseUSLottoDrawDate,
  transformCash4LifeNumbers,
  transformMegaMillionsNumbers,
  transformPowerballNumbers,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving US lottery draws
 * Handles: POWERBALL, MEGA_MILLIONS, CASH4LIFE
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
    @inject('clients.DataNYGovClient')
    private dataNYGovClient: DataNYGovClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from data.ny.gov and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.POWERBALL:
        return this.fetchAndTransformPowerball(dateFrom, dateTo);
      case LottoType.MEGA_MILLIONS:
        return this.fetchAndTransformMegaMillions(dateFrom, dateTo);
      case LottoType.CASH4LIFE:
        return this.fetchAndTransformCash4Life(dateFrom, dateTo);
      default:
        this.loggerService.log(`Unsupported US lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * US lotteries use drawLabel + gameTypeName as unique key (no externalDrawId)
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  private async fetchAndTransformPowerball(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws: PowerballDrawDto[] = await this.dataNYGovClient.fetchPowerballDraws(
      dateFrom,
      dateTo,
    );

    return draws.map(draw => {
      const drawDate = parseUSLottoDrawDate(draw.draw_date);
      const {main, secondary} = transformPowerballNumbers(draw.winning_numbers);

      return {
        drawDate,
        drawLabel: generateUSLottoDrawLabel(drawDate),
        gameTypeName: LottoType.POWERBALL,
        externalDrawId: null,
        results: [
          {
            winClass: null,
            winningNumber: main,
            secWinningNumber: secondary,
          },
        ],
      };
    });
  }

  private async fetchAndTransformMegaMillions(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws: MegaMillionsDrawDto[] = await this.dataNYGovClient.fetchMegaMillionsDraws(
      dateFrom,
      dateTo,
    );

    return draws.map(draw => {
      const drawDate = parseUSLottoDrawDate(draw.draw_date);
      const {main, secondary} = transformMegaMillionsNumbers(draw.winning_numbers, draw.mega_ball);

      return {
        drawDate,
        drawLabel: generateUSLottoDrawLabel(drawDate),
        gameTypeName: LottoType.MEGA_MILLIONS,
        externalDrawId: null,
        results: [
          {
            winClass: null,
            winningNumber: main,
            secWinningNumber: secondary,
          },
        ],
      };
    });
  }

  private async fetchAndTransformCash4Life(
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws: Cash4LifeDrawDto[] = await this.dataNYGovClient.fetchCash4LifeDraws(
      dateFrom,
      dateTo,
    );

    return draws.map(draw => {
      const drawDate = parseUSLottoDrawDate(draw.draw_date);
      const {main, secondary} = transformCash4LifeNumbers(draw.winning_numbers, draw.cash_ball);

      return {
        drawDate,
        drawLabel: generateUSLottoDrawLabel(drawDate),
        gameTypeName: LottoType.CASH4LIFE,
        externalDrawId: null,
        results: [
          {
            winClass: null,
            winningNumber: main,
            secWinningNumber: secondary,
          },
        ],
      };
    });
  }
}
