import {type Getter, inject} from '@loopback/core';
import {type BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';

import type {PostgresDataSource} from '../datasources';
import {
  type Subscription,
  SubscriptionHistory,
  type SubscriptionHistoryRelations,
  type User,
} from '../models';

import type {SubscriptionRepository} from './subscriptionRepository';
import type {UserRepository} from './userRepository';

export class SubscriptionHistoryRepository extends DefaultCrudRepository<
  SubscriptionHistory,
  typeof SubscriptionHistory.prototype.id,
  SubscriptionHistoryRelations
> {
  public readonly subscription: BelongsToAccessor<
    Subscription,
    typeof SubscriptionHistory.prototype.id
  >;
  public readonly user: BelongsToAccessor<User, typeof SubscriptionHistory.prototype.id>;

  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('SubscriptionRepository')
    protected subscriptionRepositoryGetter: Getter<SubscriptionRepository>,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(SubscriptionHistory, dataSource);
    this.subscription = this.createBelongsToAccessorFor(
      'subscription',
      subscriptionRepositoryGetter,
    );
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('subscription', this.subscription.inclusionResolver);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }
}
