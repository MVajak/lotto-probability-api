import {type LifeCycleObserver, inject, lifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const defaultConfig = {
  name: 'postgresDS',
  connector: 'postgresql',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'lotto_probability',
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
