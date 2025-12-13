import {BindingScope, inject, injectable} from '@loopback/core';

import {
  generateUKLottoDrawLabel,
  isInDateRange,
  parseUKLottoDrawDate,
  transformEuroMillionsNumbers,
  transformSetForLifeNumbers,
  transformThunderballNumbers,
  transformUKLottoNumbers,
} from '../clients/helpers/ukLottoTransformers';
import {UKLotteryClient} from '../clients/UKLotteryClient';
import {LottoType} from '../common/types';
import {PostgresDataSource} from '../datasources';
import {LoggerService} from '../services/logger/loggerService';
import {LottoDrawService} from '../services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from '../services/lottoDrawResult/lottoDrawResultService';

import {AbstractLottoDrawCronService, TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Base interface for UK lottery draw DTOs
 * All UK DTOs share these common properties
 */
interface UKDrawDto {
  drawDate: string;
  drawNumber: number;
}

/**
 * Cron service for fetching and saving UK lottery draws
 * Handles: UK_EUROMILLIONS, UK_LOTTO, UK_THUNDERBALL, UK_SET_FOR_LIFE
 */
@injectable({scope: BindingScope.SINGLETON})
export class UKLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('clients.UKLotteryClient')
    private ukLotteryClient: UKLotteryClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from UK National Lottery CSV and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    switch (lottoType) {
      case LottoType.UK_EUROMILLIONS:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchEuroMillionsDraws(),
          transformEuroMillionsNumbers,
          LottoType.UK_EUROMILLIONS,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_LOTTO:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchLottoDraws(),
          transformUKLottoNumbers,
          LottoType.UK_LOTTO,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_THUNDERBALL:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchThunderballDraws(),
          transformThunderballNumbers,
          LottoType.UK_THUNDERBALL,
          dateFrom,
          dateTo,
        );
      case LottoType.UK_SET_FOR_LIFE:
        return this.fetchAndTransform(
          () => this.ukLotteryClient.fetchSetForLifeDraws(),
          transformSetForLifeNumbers,
          LottoType.UK_SET_FOR_LIFE,
          dateFrom,
          dateTo,
        );
      default:
        this.loggerService.log(`Unsupported UK lottery type: ${lottoType}`);
        return [];
    }
  }

  /**
   * UK lotteries use drawLabel + gameTypeName as unique key
   * drawLabel is the draw number (e.g., "1902")
   */
  protected buildLookupKey(draw: {
    drawLabel: string | null;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.drawLabel}-${draw.gameTypeName}`;
  }

  /**
   * Generic fetch and transform method for all UK lottery types
   * Eliminates code duplication across the 4 lottery-specific methods
   */
  private async fetchAndTransform<T extends UKDrawDto>(
    fetchFn: () => Promise<T[]>,
    transformFn: (draw: T) => {main: string; secondary: string},
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const draws = await fetchFn();

    return draws
      .filter(draw => {
        const drawDate = parseUKLottoDrawDate(draw.drawDate);
        return isInDateRange(drawDate, dateFrom, dateTo);
      })
      .map(draw => {
        const drawDate = parseUKLottoDrawDate(draw.drawDate);
        const {main, secondary} = transformFn(draw);

        return {
          drawDate,
          drawLabel: generateUKLottoDrawLabel(draw.drawNumber),
          gameTypeName: lottoType,
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
