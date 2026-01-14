import {inject} from '@loopback/core';

import type {PostgresDataSource} from '../datasources';
import {FeatureFlag, type FeatureFlagRelations} from '../models';
import {BaseRepository} from './baseRepository';

export class FeatureFlagRepository extends BaseRepository<
  FeatureFlag,
  typeof FeatureFlag.prototype.id,
  FeatureFlagRelations
> {
  constructor(@inject('datasources.postgresDS') dataSource: PostgresDataSource) {
    super(FeatureFlag, dataSource);
  }

  /**
   * Find feature flag by key
   */
  async findByKey(key: string): Promise<FeatureFlag | null> {
    const flags = await this.find({where: {key}, limit: 1});
    return flags.length > 0 ? flags[0] : null;
  }

  /**
   * Get all active feature flags
   */
  async findAllActive(): Promise<FeatureFlag[]> {
    return this.find();
  }
}
