import {BindingScope, inject, injectable} from '@loopback/core';
import {IsolationLevel, Where} from '@loopback/repository';
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
      this.loggerService.log(`No lotto draws fetched for ${payload.lottoType}. Closing...`);
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

      // Use upsert to prevent duplicates - ON CONFLICT DO NOTHING
      // Only returns newly inserted draws
      const newlyInsertedDraws: LottoDraw[] = [];
      const drawChunks = chunk(drawCreateDtos, config.repository.chunkSize);
      for (const chunkedItems of drawChunks) {
        const savedDraws = await this.lottoDrawService.upsertAll(chunkedItems, {transaction});
        newlyInsertedDraws.push(...savedDraws);
      }

      if (newlyInsertedDraws.length > 0) {
        this.loggerService.log(`Inserted ${newlyInsertedDraws.length} new draws`);
      }

      // Fetch ALL draws from the database that match the ones from the API
      // This includes both newly inserted draws and existing draws
      // IMPORTANT: Use the same transaction so we can see the rows we just inserted
      const allDrawsFromDB = await this.lottoDrawService.find(
        {
          where: {
            or: estonianLottoDraws.map(lottoDraw => ({
              externalDrawId: lottoDraw.externalDrawId ?? null,
              drawLabel: lottoDraw.drawLabel ?? null,
              gameTypeName: lottoDraw.gameTypeName,
            })) as Where<LottoDraw>[],
          },
        },
        {transaction},
      );

      // Create a map using a composite key that works even when externalDrawId is null
      const drawsMap = new Map(
        allDrawsFromDB.map(draw => [
          `${draw.externalDrawId ?? 'null'}-${draw.drawLabel ?? 'null'}-${draw.gameTypeName ?? 'null'}`,
          draw,
        ]),
      );

      const drawResults = estonianLottoDraws.flatMap(lottoDraw => {
        const key = `${lottoDraw.externalDrawId ?? 'null'}-${lottoDraw.drawLabel ?? 'null'}-${lottoDraw.gameTypeName ?? 'null'}`;
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

      // Use upsert to prevent duplicates - ON CONFLICT DO NOTHING
      if (drawResults.length) {
        const drawResultChunks = chunk(drawResults, config.repository.chunkSize);
        let totalInserted = 0;
        for (const chunkedItems of drawResultChunks) {
          const insertedResults = await this.lottoDrawResultService.upsertAll(chunkedItems, {
            transaction,
          });
          totalInserted += insertedResults.length;
        }
        if (totalInserted > 0) {
          this.loggerService.log(`Inserted ${totalInserted} new results`);
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

    // Fetch all draws from Estonian Lotto API
    // Deduplication is now handled at the database level with ON CONFLICT
    return await this.estonianLottoApiClient.getAllEstonianLottoDraws(payload, csrfToken, client);
  }
}
