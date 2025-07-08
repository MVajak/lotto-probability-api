import {BindingScope, inject, injectable} from '@loopback/core';

import {EstonianLottoApiClient} from '../clients/EstonianLottoApiClient';
import {ALL_PROBABILITY_LOTTO} from '../common/types';
import {PostgresDataSource} from '../datasources/postgres.datasource';
import {LottoDrawSearchDto} from '../models/LottoNumbers/LottoDrawSearchDto';
import {CsrfService} from '../services/csrf/csrf.service';
import {LoggerService} from '../services/logger/loggerService';
import {LottoDrawService} from '../services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from '../services/lottoDrawResult/lottoDrawResultService';

import {LottoDrawCronService} from './lottoDrawCronService';
import {LastDrawDate} from './types';

@injectable({scope: BindingScope.SINGLETON})
export class ResetLottoDrawsCronService extends LottoDrawCronService {
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
  ) {
    super(
      dataSource,
      loggerService,
      csrfService,
      lottoDrawService,
      lottoDrawResultService,
      estonianLottoApiClient,
    );
  }

  async resetDraws(): Promise<void> {
    this.loggerService.log(`Deleting everything and resaving every draw...`);

    await this.deleteAllDraws();
    await this.saveAllDraws();

    this.loggerService.log(`Resetting successful.`);
  }

  private async deleteAllDraws(): Promise<void> {
    await this.lottoDrawService.hardDeleteAll({});
    await this.lottoDrawResultService.hardDeleteAll({});
  }

  private async saveAllDraws(): Promise<void> {
    const now = new Date();
    for (const lottoType of ALL_PROBABILITY_LOTTO) {
      const payload: LottoDrawSearchDto = {
        lottoType,
        dateFrom: new Date(LastDrawDate[lottoType]).toISOString(),
        dateTo: now.toISOString(),
      };

      await this.saveDraws(payload);
    }
  }
}
