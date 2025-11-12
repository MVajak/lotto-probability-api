import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasOneRepositoryFactory, repository} from '@loopback/repository';

import {PostgresDataSource} from '../datasources';
import {Subscription, User, UserRelations} from '../models';

import {SubscriptionRepository} from './subscriptionRepository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly subscription: HasOneRepositoryFactory<Subscription, typeof User.prototype.id>;

  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('SubscriptionRepository')
    protected subscriptionRepositoryGetter: Getter<SubscriptionRepository>,
  ) {
    super(User, dataSource);
    this.subscription = this.createHasOneRepositoryFactoryFor(
      'subscription',
      subscriptionRepositoryGetter,
    );
    this.registerInclusionResolver('subscription', this.subscription.inclusionResolver);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.find({where: {email}, limit: 1});
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Find user by referral code
   */
  async findByReferralCode(code: string): Promise<User | null> {
    const users = await this.find({where: {referralCode: code}, limit: 1});
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Update login tracking
   */
  async trackLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.updateById(userId, {
      loginCount: await this.getLoginCount(userId),
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress || null,
    });
  }

  private async getLoginCount(userId: string): Promise<number> {
    const user = await this.findById(userId);
    return (user.loginCount || 0) + 1;
  }
}
