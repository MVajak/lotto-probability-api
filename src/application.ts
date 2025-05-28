import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {RestExplorerBindings, RestExplorerComponent} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';

import {EstonianLottoApiClient} from './clients/EstonianLottoApiClient';
import {LottoProbabilityController} from './controllers/lottoProbabilityController';
import {CsrfService} from './services/csrf/csrf.service';
import {LottoProbabilityService} from './services/lottoNumbers/lottoProbabilityService';
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

    // Binding services
    this.bind('services.LottoProbabilityService').toClass(LottoProbabilityService);
    this.bind('services.CsrfService').toClass(CsrfService);
    this.bind('clients.EstonianLottoApiClient').toClass(EstonianLottoApiClient);

    // Binding controllers
    this.controller(LottoProbabilityController);

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
