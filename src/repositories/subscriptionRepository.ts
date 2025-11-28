import {Getter, inject} from '@loopback/core';
import {
  BelongsToAccessor,
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';

import {PostgresDataSource} from '../datasources';
import {
  Subscription,
  SubscriptionHistory,
  SubscriptionRelations,
  SubscriptionTier,
  User,
} from '../models';

import {SubscriptionHistoryRepository} from './subscriptionHistoryRepository';
import {SubscriptionTierRepository} from './subscriptionTierRepository';
import {UserRepository} from './userRepository';

export class SubscriptionRepository extends DefaultCrudRepository<
  Subscription,
  typeof Subscription.prototype.id,
  SubscriptionRelations
> {
  public readonly user: BelongsToAccessor<User, typeof Subscription.prototype.id>;
  public readonly tier: BelongsToAccessor<SubscriptionTier, typeof Subscription.prototype.id>;
  public readonly history: HasManyRepositoryFactory<
    SubscriptionHistory,
    typeof Subscription.prototype.id
  >;

  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
    @repository.getter('SubscriptionTierRepository')
    protected subscriptionTierRepositoryGetter: Getter<SubscriptionTierRepository>,
    @repository.getter('SubscriptionHistoryRepository')
    protected subscriptionHistoryRepositoryGetter: Getter<SubscriptionHistoryRepository>,
  ) {
    super(Subscription, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.tier = this.createBelongsToAccessorFor('tier', subscriptionTierRepositoryGetter);
    this.history = this.createHasManyRepositoryFactoryFor(
      'history',
      subscriptionHistoryRepositoryGetter,
    );
    this.registerInclusionResolver('user', this.user.inclusionResolver);
    this.registerInclusionResolver('tier', this.tier.inclusionResolver);
    this.registerInclusionResolver('history', this.history.inclusionResolver);
  }

  /**
   * Find subscription by user ID
   */
  async findByUserId(userId: string): Promise<Subscription | null> {
    const subscriptions = await this.find({where: {userId}, limit: 1});
    return subscriptions.length > 0 ? subscriptions[0] : null;
  }

  /**
   * Find subscription by Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const subscriptions = await this.find({where: {stripeCustomerId}, limit: 1});
    return subscriptions.length > 0 ? subscriptions[0] : null;
  }
}
