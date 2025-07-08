import {inject, LifeCycleObserver, lifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

import {config} from '../common/config';

const defaultConfig = {
  name: 'postgresDS',
  connector: 'postgresql',
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
};

@lifeCycleObserver('datasource')
export class PostgresDataSource extends juggler.DataSource implements LifeCycleObserver {
  static dataSourceName = 'postgresDS';

  constructor(
    @inject('datasources.config.postgresDS', {optional: true})
    dsConfig: object = defaultConfig,
  ) {
    super(dsConfig);
  }
}
