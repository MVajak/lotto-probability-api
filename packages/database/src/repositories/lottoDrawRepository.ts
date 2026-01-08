import {type Getter, inject} from '@loopback/core';
import {type DataObject, type HasManyRepositoryFactory, repository} from '@loopback/repository';
import type {Options} from '@loopback/repository/src/common-types';

import type {PostgresDataSource} from '../datasources';
import {LottoDraw, type LottoDrawRelations, type LottoDrawResult} from '../models';

import {BaseRepository} from './baseRepository';
import type {LottoDrawResultRepository} from './lottoDrawResultRepository';

export class LottoDrawRepository extends BaseRepository<
  LottoDraw,
  typeof LottoDraw.prototype.id,
  LottoDrawRelations
> {
  public readonly results: HasManyRepositoryFactory<LottoDrawResult, string>;

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
   * Find draws containing a specific number within a date range
   *
   * @param number - The number to search for
   * @param gameTypeName - Type of lottery game
   * @param dateFrom - Start date
   * @param dateTo - End date
   * @param position - Optional position (for positional games like Jokker)
   * @param useSecondaryNumbers - If true, search in sec_winning_number; if false, search in winning_number
   * @param winClass - Optional win class filter (for games like BINGO with multiple prize tiers)
   * @param options - Query options
   * @returns Array of draws with their results
   */
  async findDrawsWithNumber(
    number: string,
    gameTypeName: string,
    dateFrom: Date,
    dateTo: Date,
    position?: number,
    useSecondaryNumbers?: boolean,
    winClass?: number,
    options?: Options,
  ): Promise<LottoDraw[]> {
    const connector = this.dataSource.connector;
    if (!connector?.execute) {
      throw new Error('Database connector not available');
    }

    // Determine which column to search based on useSecondaryNumbers flag
    const numberColumn = useSecondaryNumbers ? 'sec_winning_number' : 'winning_number';

    // Build SQL query to find draws containing the specific number
    // Note: winning_number and sec_winning_number are comma-separated strings
    // We need to match the number as a whole value, not as a substring
    // Using regex pattern: (^|,)NUMBER(,|$) to match exact number within CSV
    // Also mapping snake_case column names to camelCase for TypeScript model
    let sql = `
      SELECT DISTINCT
        ld.id,
        ld.draw_date AS "drawDate",
        ld.draw_label AS "drawLabel",
        ld.external_draw_id AS "externalDrawId",
        ld.game_type_name AS "gameTypeName",
        ld.created_at AS "createdAt",
        ld.updated_at AS "updatedAt",
        ld.deleted_at AS "deletedAt"
      FROM lotto_draw ld
      INNER JOIN lotto_draw_result ldr ON ld.id = ldr.draw_id
      WHERE ld.game_type_name = $1
        AND ld.draw_date >= $2
        AND ld.draw_date <= $3
        AND ldr.${numberColumn} ~ ('(^|,)' || $4 || '(,|$)')
        AND ld.deleted_at IS NULL
        AND ldr.deleted_at IS NULL
    `;

    const params: (string | Date | number)[] = [gameTypeName, dateFrom, dateTo, number];
    let paramIndex = 5;

    // Add position filter for positional games (like Jokker)
    if (position !== undefined) {
      sql += ` AND ldr.win_class = $${paramIndex}`;
      params.push(position);
      paramIndex++;
    }

    // Add win class filter for games with multiple prize tiers (like BINGO)
    if (winClass !== undefined) {
      sql += ` AND ldr.win_class = $${paramIndex}`;
      params.push(winClass);
      paramIndex++;
    }

    sql += ' ORDER BY ld.draw_date DESC';

    return new Promise<LottoDraw[]>((resolve, reject) => {
      const executeFn = connector.execute!.bind(connector);
      executeFn(sql, params, options, (err: Error | null, result?: LottoDraw[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    });
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
    // Note: id column is omitted - PostgreSQL will use DEFAULT (uuid_generate_v4())
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
      ON CONFLICT (draw_label, game_type_name)
      DO NOTHING
      RETURNING *;
    `;

    return new Promise<LottoDraw[]>((resolve, reject) => {
      // We've already verified execute exists above, safe to use non-null assertion
      const executeFn = connector.execute!.bind(connector);
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
