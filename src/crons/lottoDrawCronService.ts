import {BindingScope, inject, injectable} from '@loopback/core';
import {Filter} from '@loopback/filter';
import {IsolationLevel} from '@loopback/repository';
import {chunk} from 'lodash';

import {EstonianLottoApiClient} from '../clients/EstonianLottoApiClient';
import {config} from '../common/config';
import {PostgresDataSource} from '../datasources';
import {LottoDraw, LottoDrawCreateDto, LottoDrawResultCreateDto} from '../models';
import {EstonianLottoDrawDto} from '../models/EstonianLotto/EstonianLottoDrawDto';
import {LottoDrawSearchDto} from '../models/LottoNumbers/LottoDrawSearchDto';
import {CsrfService} from '../services/csrf/csrf.service';
import {LoggerService} from '../services/logger/loggerService';
import {LottoDrawService} from '../services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from '../services/lottoDrawResult/lottoDrawResultService';

@injectable({scope: BindingScope.SINGLETON})
export class LottoDrawCronService {
  constructor(
    @inject('datasources.postgresDS')
    protected dataSource: PostgresDataSource,
    @inject('services.LoggerService')
    protected loggerService: LoggerService,
    @inject('services.CsrfService')
    protected csrfService: CsrfService,
    @inject('services.LottoDrawService')
    protected lottoDrawService: LottoDrawService,
    @inject('services.LottoDrawResultService')
    protected lottoDrawResultService: LottoDrawResultService,
    @inject('clients.EstonianLottoApiClient')
    protected estonianLottoApiClient: EstonianLottoApiClient,
  ) {}

  protected async saveDraws(payload: LottoDrawSearchDto): Promise<void> {
    const estonianLottoDraws: EstonianLottoDrawDto[] = await this.fetchEstonianLottoDraws(payload);

    if (!estonianLottoDraws.length) {
      this.loggerService.log(`No new lotto draws found for ${payload.lottoType}. Closing...`);
      return;
    }

    await this.saveLottoData(estonianLottoDraws);
  }

  private async saveLottoData(estonianLottoDraws: EstonianLottoDrawDto[]): Promise<void> {
    const transaction = await this.dataSource.beginTransaction(IsolationLevel.READ_COMMITTED);

    try {
      const drawCreateDtos = estonianLottoDraws.map(lottoDraw => {
        return new LottoDrawCreateDto({
          drawDate: new Date(lottoDraw.drawDate),
          externalDrawId: lottoDraw.externalDrawId,
          gameTypeName: lottoDraw.gameTypeName,
          drawLabel: lottoDraw.drawLabel,
        });
      });

      const draws: LottoDraw[] = [];
      const drawChunks = chunk(drawCreateDtos, config.repository.chunkSize);
      for (const chunkedItems of drawChunks) {
        const savedDraws = await this.lottoDrawService.createAll(chunkedItems, {transaction});
        draws.push(...savedDraws);
      }

      // Create a map using a composite key that works even when externalDrawId is null
      const drawsMap = new Map(
        draws.map(draw => [
          `${draw.drawDate.toISOString()}-${draw.externalDrawId ?? 'null'}-${draw.drawLabel ?? 'null'}`,
          draw,
        ]),
      );

      const drawResults = estonianLottoDraws.flatMap(lottoDraw => {
        const key = `${new Date(lottoDraw.drawDate).toISOString()}-${lottoDraw.externalDrawId ?? 'null'}-${lottoDraw.drawLabel ?? 'null'}`;
        const matchingDraw = drawsMap.get(key);

        if (!matchingDraw) {
          return [];
        }

        return (
          lottoDraw.results?.map(result => {
            return new LottoDrawResultCreateDto({
              winClass: result.winClass ?? null,
              winningNumber: result.winningNumber,
              secWinningNumber: result.secWinningNumber,
              drawId: matchingDraw.id,
            });
          }) || []
        );
      });

      if (drawResults.length) {
        const drawResultChunks = chunk(drawResults, config.repository.chunkSize);
        for (const chunkedItems of drawResultChunks) {
          await this.lottoDrawResultService.createAll(chunkedItems, {transaction});
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  private async fetchEstonianLottoDraws(
    payload: LottoDrawSearchDto,
  ): Promise<EstonianLottoDrawDto[]> {
    const csrfToken = await this.csrfService.getCsrfToken();
    const client = this.csrfService.getClient();

    const draws = await this.estonianLottoApiClient.getAllEstonianLottoDraws(
      payload,
      csrfToken,
      client,
    );
    return this.getValidEstonianLottoDraws(payload, draws);
  }

  private async getValidEstonianLottoDraws(
    payload: LottoDrawSearchDto,
    estonianLottoDraws: EstonianLottoDrawDto[],
  ): Promise<EstonianLottoDrawDto[]> {
    const {lottoType, dateFrom, dateTo} = payload;
    const filter: Filter<LottoDraw> = {
      where: {
        and: [
          {drawDate: {gte: new Date(dateFrom)}},
          {drawDate: {lte: new Date(dateTo)}},
          {gameTypeName: lottoType},
        ],
      },
      fields: ['id', 'externalDrawId', 'drawLabel'],
    };
    const localDraws: Pick<LottoDraw, 'id' | 'externalDrawId' | 'drawLabel'>[] =
      await this.lottoDrawService.find(filter);

    if (!localDraws.length) {
      return estonianLottoDraws;
    }

    const existingDrawKeys = new Set(
      localDraws.map(draw => `${draw.externalDrawId ?? 'null'}-${draw.drawLabel ?? 'null'}`),
    );

    return estonianLottoDraws.filter(
      draw => !existingDrawKeys.has(`${draw.externalDrawId ?? 'null'}-${draw.drawLabel ?? 'null'}`),
    );
  }
}
