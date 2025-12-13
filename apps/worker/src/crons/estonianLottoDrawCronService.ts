import {BindingScope, inject, injectable} from '@loopback/core';
import type {
  CsrfService,
  EstonianLottoApiClient,
  LoggerService,
  LottoDrawResultService,
  LottoDrawSearchDto,
  LottoDrawService,
} from '@lotto/core';
import type {PostgresDataSource} from '@lotto/database';
import type {LottoType} from '@lotto/shared';

import {AbstractLottoDrawCronService, type TransformedDraw} from './abstractLottoDrawCronService';

/**
 * Cron service for fetching and saving Estonian lottery draws
 * Handles: EURO, VIKINGLOTTO, KENO, JOKKER, BINGO
 */
@injectable({scope: BindingScope.SINGLETON})
export class EstonianLottoDrawCronService extends AbstractLottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    loggerService: LoggerService,
    @inject('services.LottoDrawService')
    lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    lottoDrawResultService: LottoDrawResultService,
    @inject('services.CsrfService')
    private csrfService: CsrfService,
    @inject('clients.EstonianLottoApiClient')
    private estonianLottoApiClient: EstonianLottoApiClient,
  ) {
    super(dataSource, loggerService, lottoDrawService, lottoDrawResultService);
  }

  /**
   * Fetch draws from Estonian Lotto API and transform to common format
   */
  protected async fetchAndTransformDraws(
    lottoType: LottoType,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<TransformedDraw[]> {
    const csrfToken = await this.csrfService.getCsrfToken();
    const client = this.csrfService.getClient();

    const payload: LottoDrawSearchDto = {
      lottoType,
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    };

    const estonianDraws = await this.estonianLottoApiClient.getAllEstonianLottoDraws(
      payload,
      csrfToken,
      client,
    );

    // Transform Estonian API response to common format
    return estonianDraws.map(draw => ({
      drawDate: new Date(draw.drawDate),
      drawLabel: draw.drawLabel,
      gameTypeName: draw.gameTypeName,
      externalDrawId: draw.externalDrawId,
      results:
        draw.results?.map(result => ({
          winClass: result.winClass ?? null,
          winningNumber: result.winningNumber,
          secWinningNumber: result.secWinningNumber,
        })) || [],
    }));
  }

  /**
   * Estonian lotteries use externalDrawId + drawLabel + gameTypeName as unique key
   */
  protected buildLookupKey(draw: {
    drawLabel: string;
    gameTypeName: string;
    externalDrawId: string | null;
  }): string {
    return `${draw.externalDrawId ?? 'null'}-${draw.drawLabel}-${draw.gameTypeName}`;
  }
}
