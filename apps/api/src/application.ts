import path from 'node:path';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';

// Import from workspace packages
import {
  LottoDrawRepository,
  LottoDrawResultRepository,
  MagicLinkTokenRepository,
  PostgresDataSource,
  SubscriptionHistoryRepository,
  SubscriptionRepository,
  SubscriptionTierRepository,
  UserRepository,
} from '@lotto/database';

import {
  DataNYGovClient,
  EstonianLottoApiClient,
  LoggerService,
  LottoDrawResultService,
  LottoDrawService,
  LottoProbabilityService,
  NumberHistoryService,
  StripeService,
  SubscriptionService,
  SubscriptionTierService,
  UKLotteryClient,
} from '@lotto/core';

// Local imports (API-specific)
import {
  AuthController,
  LottoProbabilityController,
  SubscriptionController,
  SubscriptionTierController,
} from './controllers';
import {JWTAuthenticationStrategy} from './middleware';
import {MySequence} from './sequence';
import {AuthService, CsrfService, EmailService, JWTService, MagicLinkService} from './services';

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

    // Repositories
    this.repository(LottoDrawRepository);
    this.repository(LottoDrawResultRepository);
    this.repository(UserRepository);
    this.repository(SubscriptionRepository);
    this.repository(SubscriptionTierRepository);
    this.repository(SubscriptionHistoryRepository);
    this.repository(MagicLinkTokenRepository);

    // Services - MUST be bound before authentication strategy
    this.bind('services.LottoProbabilityService').toClass(LottoProbabilityService);
    this.bind('services.NumberHistoryService').toClass(NumberHistoryService);
    this.bind('services.LottoDrawService').toClass(LottoDrawService);
    this.bind('services.LottoDrawResultService').toClass(LottoDrawResultService);
    this.bind('services.CsrfService').toClass(CsrfService);
    this.bind('services.LoggerService').toClass(LoggerService);
    this.bind('services.JWTService').toClass(JWTService);
    this.bind('services.MagicLinkService').toClass(MagicLinkService);
    this.bind('services.EmailService').toClass(EmailService);
    this.bind('services.AuthService').toClass(AuthService);
    this.bind('services.SubscriptionTierService').toClass(SubscriptionTierService);
    this.bind('services.StripeService').toClass(StripeService);
    this.bind('services.SubscriptionService').toClass(SubscriptionService);

    // Authentication - AFTER services are bound
    this.component(AuthenticationComponent);
    // Register JWT authentication strategy
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Clients
    this.bind('clients.EstonianLottoApiClient').toClass(EstonianLottoApiClient);
    this.bind('clients.DataNYGovClient').toClass(DataNYGovClient);
    this.bind('clients.UKLotteryClient').toClass(UKLotteryClient);

    // Controllers
    this.controller(LottoProbabilityController);
    this.controller(AuthController);
    this.controller(SubscriptionController);
    this.controller(SubscriptionTierController);

    this.projectRoot = __dirname;
    this.bootOptions = {
      controllers: {
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
