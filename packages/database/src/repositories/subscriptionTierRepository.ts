import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';

import type {SubscriptionTierCode} from '@lotto/shared';

import type {PostgresDataSource} from '../datasources';
import {SubscriptionTier, type SubscriptionTierRelations} from '../models';

export class SubscriptionTierRepository extends DefaultCrudRepository<
  SubscriptionTier,
  typeof SubscriptionTier.prototype.id,
  SubscriptionTierRelations
> {
  constructor(@inject('datasources.postgresDS') dataSource: PostgresDataSource) {
    super(SubscriptionTier, dataSource);
  }

  /**
   * Find tier by code
   */
  async findByCode(code: SubscriptionTierCode): Promise<SubscriptionTier | null> {
    const tiers = await this.find({where: {code}, limit: 1});
    return tiers.length > 0 ? tiers[0] : null;
  }

  /**
   * Get all tiers ordered by display order
   */
  async findAllOrdered(): Promise<SubscriptionTier[]> {
    return this.find({order: ['displayOrder ASC']});
  }
}
