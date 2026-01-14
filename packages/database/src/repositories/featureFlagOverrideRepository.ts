import {inject} from '@loopback/core';

import type {PostgresDataSource} from '../datasources';
import {FeatureFlagOverride, type FeatureFlagOverrideRelations} from '../models';
import {BaseRepository} from './baseRepository';

export class FeatureFlagOverrideRepository extends BaseRepository<
  FeatureFlagOverride,
  typeof FeatureFlagOverride.prototype.id,
  FeatureFlagOverrideRelations
> {
  constructor(@inject('datasources.postgresDS') dataSource: PostgresDataSource) {
    super(FeatureFlagOverride, dataSource);
  }

  /**
   * Find override by flag ID and user email
   */
  async findByFlagAndEmail(featureFlagId: string, userEmail: string): Promise<FeatureFlagOverride | null> {
    const overrides = await this.find({
      where: {featureFlagId, userEmail},
      limit: 1,
    });
    return overrides.length > 0 ? overrides[0] : null;
  }

  /**
   * Get all overrides for a user email
   */
  async findByEmail(userEmail: string): Promise<FeatureFlagOverride[]> {
    return this.find({where: {userEmail}});
  }
}
