import {BootMixin} from '@loopback/boot';
import {Application} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';

// Database
import {LottoDrawRepository, LottoDrawResultRepository, PostgresDataSource} from '@lotto/database';

// Core services and clients
import {
  AustralianLotteryClient,
  CanadianLotteryClient,
  CsrfService,
  USLotteryClient,
  EstonianLottoApiClient,
  FrenchLotteryClient,
  GermanLotteryClient,
  IrishLotteryClient,
  LoggerService,
  LottoDrawResultService,
  LottoDrawService,
  SouthAfricanLotteryClient,
  SpanishLotteryClient,
  UKLotteryClient,
} from '@lotto/core';

import {CronBooter} from './boot/cron.boot';
// Worker crons
import {
  AustralianLottoDrawCronService,
  CanadianLottoDrawCronService,
  EstonianLottoDrawCronService,
  FrenchLottoDrawCronService,
  GermanLottoDrawCronService,
  IrishLottoDrawCronService,
  SouthAfricanLottoDrawCronService,
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
    this.bind('clients.USLotteryClient').toClass(USLotteryClient);
    this.bind('clients.UKLotteryClient').toClass(UKLotteryClient);
    this.bind('clients.SpanishLotteryClient').toClass(SpanishLotteryClient);
    this.bind('clients.IrishLotteryClient').toClass(IrishLotteryClient);
    this.bind('clients.FrenchLotteryClient').toClass(FrenchLotteryClient);
    this.bind('clients.GermanLotteryClient').toClass(GermanLotteryClient);
    this.bind('clients.CanadianLotteryClient').toClass(CanadianLotteryClient);
    this.bind('clients.AustralianLotteryClient').toClass(AustralianLotteryClient);
    this.bind('clients.SouthAfricanLotteryClient').toClass(SouthAfricanLotteryClient);

    // Cron services
    this.bind('services.EstonianLottoDrawCronService').toClass(EstonianLottoDrawCronService);
    this.bind('services.USLottoDrawCronService').toClass(USLottoDrawCronService);
    this.bind('services.UKLottoDrawCronService').toClass(UKLottoDrawCronService);
    this.bind('services.SpanishLottoDrawCronService').toClass(SpanishLottoDrawCronService);
    this.bind('services.IrishLottoDrawCronService').toClass(IrishLottoDrawCronService);
    this.bind('services.FrenchLottoDrawCronService').toClass(FrenchLottoDrawCronService);
    this.bind('services.GermanLottoDrawCronService').toClass(GermanLottoDrawCronService);
    this.bind('services.CanadianLottoDrawCronService').toClass(CanadianLottoDrawCronService);
    this.bind('services.AustralianLottoDrawCronService').toClass(AustralianLottoDrawCronService);
    this.bind('services.SouthAfricanLottoDrawCronService').toClass(SouthAfricanLottoDrawCronService);

    // Booters
    this.booters(CronBooter);
  }
}
