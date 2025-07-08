import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';

import {CronBooter} from './boot/cron.boot';
import {EstonianLottoApiClient} from './clients/EstonianLottoApiClient';
import {LottoProbabilityController} from './controllers/lottoProbabilityController';
import {NewLottoDrawsCronService} from './crons/newLottoDrawsCronService';
import {ResetLottoDrawsCronService} from './crons/resetLottoDrawsCronService';
import {PostgresDataSource} from './datasources/postgres.datasource';
import {LottoDrawRepository} from './repositories/lottoDrawRepository';
import {LottoDrawResultRepository} from './repositories/lottoDrawResultRepository';
import {CsrfService} from './services/csrf/csrf.service';
import {LoggerService} from './services/logger/loggerService';
import {LottoDrawService} from './services/lottoDraw/lottoDrawService';
import {LottoDrawResultService} from './services/lottoDrawResult/lottoDrawResultService';
import {LottoProbabilityService} from './services/lottoProbability/lottoProbabilityService';
import {MySequence} from './sequence';

export {ApplicationConfig};

export class LottoApiApplication extends BootMixin(ServiceMixin(RepositoryMixin(RestApplication))) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.dataSource(PostgresDataSource, 'postgresDS');

    // Booters
    this.booters(CronBooter);

    // Repositories
    this.repository(LottoDrawRepository);
    this.repository(LottoDrawResultRepository);

    // Services
    this.bind('services.LottoProbabilityService').toClass(LottoProbabilityService);
    this.bind('services.LottoDrawService').toClass(LottoDrawService);
    this.bind('services.LottoDrawResultService').toClass(LottoDrawResultService);
    this.bind('services.CsrfService').toClass(CsrfService);
    this.bind('services.LoggerService').toClass(LoggerService);
    this.bind('services.NewLottoDrawsCronService').toClass(NewLottoDrawsCronService);
    this.bind('services.ResetLottoDrawsCronService').toClass(ResetLottoDrawsCronService);

    // Clients
    this.bind('clients.EstonianLottoApiClient').toClass(EstonianLottoApiClient);

    // Controllers
    this.controller(LottoProbabilityController);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
      dirs: ['boot'],
      extensions: ['.boot.ts'],
      nested: true,
    };
  }
}
