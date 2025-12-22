import path from 'node:path';
import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, createBindingFromClass} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';

// Import from workspace packages
import {
  LottoDrawRepository,
  LottoDrawResultRepository,
  OTPTokenRepository,
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
  NumberDetailService,
  StripeService,
  SubscriptionAdminService,
  SubscriptionHistoryService,
  SubscriptionService,
  SubscriptionTierService,
  UKLotteryClient,
  UserService,
} from '@lotto/core';

// Local imports (API-specific)
import {
  AuthController,
  LottoProbabilityController,
  SubscriptionAdminController,
  SubscriptionController,
  SubscriptionTierController,
  UserController,
} from './controllers';
import {TierGatingInterceptor} from './interceptors';
import {JWTAuthenticationStrategy} from './middleware';
import {MySequence} from './sequence';
import {AuthService, CsrfService, EmailService, JWTService, OTPService} from './services';

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
    this.repository(OTPTokenRepository);

    // Services - MUST be bound before authentication strategy
    this.bind('services.LottoProbabilityService').toClass(LottoProbabilityService);
    this.bind('services.NumberDetailService').toClass(NumberDetailService);
    this.bind('services.LottoDrawService').toClass(LottoDrawService);
    this.bind('services.LottoDrawResultService').toClass(LottoDrawResultService);
    this.bind('services.CsrfService').toClass(CsrfService);
    this.bind('services.LoggerService').toClass(LoggerService);
    this.bind('services.JWTService').toClass(JWTService);
    this.bind('services.OTPService').toClass(OTPService);
    this.bind('services.EmailService').toClass(EmailService);
    this.bind('services.AuthService').toClass(AuthService);
    this.bind('services.SubscriptionTierService').toClass(SubscriptionTierService);
    this.bind('services.StripeService').toClass(StripeService);
    this.bind('services.SubscriptionHistoryService').toClass(SubscriptionHistoryService);
    this.bind('services.SubscriptionService').toClass(SubscriptionService);
    this.bind('services.SubscriptionAdminService').toClass(SubscriptionAdminService);
    this.bind('services.UserService').toClass(UserService);

    // Authentication - AFTER services are bound
    this.component(AuthenticationComponent);
    // Register JWT authentication strategy
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Global interceptors
    this.add(createBindingFromClass(TierGatingInterceptor, {namespace: 'interceptors'}));

    // Clients
    this.bind('clients.EstonianLottoApiClient').toClass(EstonianLottoApiClient);
    this.bind('clients.DataNYGovClient').toClass(DataNYGovClient);
    this.bind('clients.UKLotteryClient').toClass(UKLotteryClient);

    // Controllers
    this.controller(LottoProbabilityController);
    this.controller(AuthController);
    this.controller(SubscriptionController);
    this.controller(SubscriptionAdminController);
    this.controller(SubscriptionTierController);
    this.controller(UserController);

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
