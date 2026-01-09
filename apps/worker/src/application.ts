import {BootMixin} from '@loopback/boot';
import {Application} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';

// Database
import {LottoDrawRepository, LottoDrawResultRepository, PostgresDataSource} from '@lotto/database';

// Core services and clients
import {
  CsrfService,
  DataNYGovClient,
  EstonianLottoApiClient,
  LoggerService,
  LottoDrawResultService,
  LottoDrawService,
  SpanishLotteryClient,
  UKLotteryClient,
} from '@lotto/core';

import {CronBooter} from './boot/cron.boot';
// Worker crons
import {
  EstonianLottoDrawCronService,
  ResetLottoDrawsCronService,
  SpanishLottoDrawCronService,
  UKLottoDrawCronService,
  USLottoDrawCronService,
} from './crons';

export class LottoWorkerApplication extends BootMixin(RepositoryMixin(Application)) {
  constructor() {
    super();

    // Required for BootMixin to locate booters
    this.projectRoot = __dirname;

    this.setupBindings();
  }

  private setupBindings(): void {
    // DataSource
    this.dataSource(PostgresDataSource, 'postgresDS');

    // Repositories
    this.repository(LottoDrawRepository);
    this.repository(LottoDrawResultRepository);

    // Services
    this.bind('services.LoggerService').toClass(LoggerService);
    this.bind('services.LottoDrawService').toClass(LottoDrawService);
    this.bind('services.LottoDrawResultService').toClass(LottoDrawResultService);
    this.bind('services.CsrfService').toClass(CsrfService);

    // Clients
    this.bind('clients.EstonianLottoApiClient').toClass(EstonianLottoApiClient);
    this.bind('clients.DataNYGovClient').toClass(DataNYGovClient);
    this.bind('clients.UKLotteryClient').toClass(UKLotteryClient);
    this.bind('clients.SpanishLotteryClient').toClass(SpanishLotteryClient);

    // Cron services
    this.bind('services.EstonianLottoDrawCronService').toClass(EstonianLottoDrawCronService);
    this.bind('services.USLottoDrawCronService').toClass(USLottoDrawCronService);
    this.bind('services.UKLottoDrawCronService').toClass(UKLottoDrawCronService);
    this.bind('services.SpanishLottoDrawCronService').toClass(SpanishLottoDrawCronService);
    this.bind('services.ResetLottoDrawsCronService').toClass(ResetLottoDrawsCronService);

    // Booters
    this.booters(CronBooter);
  }
}
