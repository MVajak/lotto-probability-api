import {Getter, inject} from '@loopback/core';
import {DataObject, HasManyRepositoryFactory, repository} from '@loopback/repository';
import {Options} from '@loopback/repository/src/common-types';

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

  /**
   * Upsert draws using PostgreSQL's ON CONFLICT to prevent duplicates
   * Returns only the newly created draws (not existing ones)
   */
  async upsertAll(entities: DataObject<LottoDraw>[], options?: Options): Promise<LottoDraw[]> {
    if (!entities.length) {
      return [];
    }

    const connector = this.dataSource.connector;
    if (!connector?.execute) {
      throw new Error('Database connector not available');
    }

    // Build the VALUES clause
    const values = entities
      .map(
        (_, index) =>
          `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`,
      )
      .join(', ');

    // Flatten all values into a single array
    const params = entities.flatMap(entity => [
      entity.drawDate,
      entity.drawLabel,
      entity.externalDrawId,
      entity.gameTypeName,
      entity.createdAt || new Date(),
      entity.updatedAt || new Date(),
    ]);

    const sql = `
      INSERT INTO lotto_draw (draw_date, draw_label, external_draw_id, game_type_name, created_at, updated_at)
      VALUES ${values}
      ON CONFLICT (external_draw_id, draw_label, game_type_name)
      DO NOTHING
      RETURNING *;
    `;

    // Execute with callback-based approach wrapped in a Promise
    // Bind connector context to preserve 'this' when execute is called
    type ExecuteCallback = (err: Error | null, result?: LottoDraw[]) => void;
    type ExecuteFunction = (
      sql: string,
      params: unknown[],
      options: Options | undefined,
      callback: ExecuteCallback,
    ) => void;

    return new Promise<LottoDraw[]>((resolve, reject) => {
      // We've already verified execute exists above, safe to use non-null assertion
      const executeFn = connector.execute!.bind(connector) as ExecuteFunction;
      executeFn(sql, params, options, (err: Error | null, result?: LottoDraw[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    });
  }
}
