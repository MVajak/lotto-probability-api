import {Getter, inject} from '@loopback/core';
import {HasManyRepositoryFactory, repository} from '@loopback/repository';

import {PostgresDataSource} from '../datasources/postgres.datasource';
import {LottoDraw, LottoDrawRelations} from '../models/LottoDraw';
import {LottoDrawResult} from '../models/LottoDrawResult';

import {BaseRepository} from './baseRepository';
import {LottoDrawResultRepository} from './lottoDrawResultRepository';

export class LottoDrawRepository extends BaseRepository<
  LottoDraw,
  typeof LottoDraw.prototype.id,
  LottoDrawRelations
> {
  public readonly results: HasManyRepositoryFactory<LottoDrawResult, typeof LottoDraw.prototype.id>;

  constructor(
    @inject('datasources.postgresDS')
    dataSource: PostgresDataSource,
    @repository.getter('LottoDrawResultRepository')
    protected lottoDrawResultRepositoryGetter: Getter<LottoDrawResultRepository>,
  ) {
    super(LottoDraw, dataSource);
    this.results = this.createHasManyRepositoryFactoryFor(
      'results',
      lottoDrawResultRepositoryGetter,
    );
    this.registerInclusionResolver('results', this.results.inclusionResolver);
  }
}
