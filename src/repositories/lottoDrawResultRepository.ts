import {Getter, inject} from '@loopback/core';
import {DataObject, repository} from '@loopback/repository';
import {Options} from '@loopback/repository/src/common-types';

import {PostgresDataSource} from '../datasources';
import {LottoDrawResult} from '../models';

import {BaseRepository} from './baseRepository';
import {LottoDrawRepository} from './lottoDrawRepository';

export class LottoDrawResultRepository extends BaseRepository<
  LottoDrawResult,
  string,
  LottoDrawResult
> {
  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('LottoDrawRepository')
    protected lottoDrawRepositoryGetter: Getter<LottoDrawRepository>,
  ) {
    super(LottoDrawResult, dataSource);
  }

  /**
   * Upsert multiple draw results using ON CONFLICT DO NOTHING
   * Returns only the newly inserted results
   */
  async upsertAll(entities: DataObject<LottoDrawResult>[], options?: Options): Promise<LottoDrawResult[]> {
    if (!entities.length) {
      return [];
    }

    const now = new Date().toISOString();
    const auditedEntities = entities.map(e => ({
      ...e,
      createdAt: now,
      updatedAt: now,
    }));

    // Use raw SQL with ON CONFLICT DO NOTHING to prevent duplicates
    const connector = this.dataSource.connector;
    if (!connector || !connector.execute) {
      throw new Error('Database connector does not support raw SQL execution');
    }

    // Build VALUES clause
    // Note: id column is omitted - PostgreSQL will use DEFAULT (uuid_generate_v4())
    const values = auditedEntities.map((entity, idx) => {
      const offset = idx * 7;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
    }).join(', ');

    const params = auditedEntities.flatMap(entity => [
      entity.drawId,
      entity.winClass,
      entity.winningNumber,
      entity.secWinningNumber,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    ]);

    const sql = `
      INSERT INTO lotto_draw_result (
        draw_id, win_class, winning_number, sec_winning_number,
        created_at, updated_at, deleted_at
      )
      VALUES ${values}
      ON CONFLICT (draw_id, win_class, winning_number, sec_winning_number) DO NOTHING
      RETURNING *;
    `;

    // Wrap connector.execute in a Promise since it expects a callback
    return new Promise((resolve, reject) => {
      // We've already verified execute exists above, safe to use non-null assertion
      const executeFn = connector.execute!.bind(connector);
      executeFn(sql, params, options, (err: Error | null, result?: LottoDrawResult[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    });
  }
}
