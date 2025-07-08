import {Getter, inject} from '@loopback/core';
import {repository} from '@loopback/repository';

import {PostgresDataSource} from '../datasources/postgres.datasource';
import {LottoDrawResult} from '../models/LottoDrawResult';

import {BaseRepository} from './baseRepository';
import {LottoDrawRepository} from './lottoDrawRepository';

export class LottoDrawResultRepository extends BaseRepository<
  LottoDrawResult,
  typeof LottoDrawResult.prototype.id,
  LottoDrawResult
> {
  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('LottoDrawRepository')
    protected lottoDrawRepositoryGetter: Getter<LottoDrawRepository>,
  ) {
    super(LottoDrawResult, dataSource);
  }
}
