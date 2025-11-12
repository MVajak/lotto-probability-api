import {BindingScope, inject, injectable} from '@loopback/core';

import {EstonianLottoApiClient} from '../clients/EstonianLottoApiClient';
import {LottoType} from '../common/types';
import {PostgresDataSource} from '../datasources/postgres.datasource';
import {LottoDrawSearchDto} from '../models/LottoNumbers/LottoDrawSearchDto';
import {CsrfService} from '../services/csrf/csrf.service';
import {LoggerService} from '../services/logger/loggerService';
import {LottoDrawService} from '../services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from '../services/lottoDrawResult/lottoDrawResultService';

import {LottoDrawCronService} from './lottoDrawCronService';

@injectable({scope: BindingScope.SINGLETON})
export class NewLottoDrawsCronService extends LottoDrawCronService {
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

  async saveLatestDraws(lottoType: LottoType): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // subtract 1 day in ms
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 1);

    this.loggerService.log(
      `Getting new ${lottoType} draws between ${yesterday.toISOString()} - ${now.toISOString()}`,
    );

    const payload: LottoDrawSearchDto = {
      lottoType,
      dateFrom: threeMonthsAgo.toISOString(),
      dateTo: now.toISOString(),
    };

    await this.saveDraws(payload);
  }
}
