import {type Getter, inject} from '@loopback/core';
import {type BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';

import type {PostgresDataSource} from '../datasources';
import {MagicLinkToken, type MagicLinkTokenRelations, type User} from '../models';

import type {UserRepository} from './userRepository';

export class MagicLinkTokenRepository extends DefaultCrudRepository<
  MagicLinkToken,
  typeof MagicLinkToken.prototype.id,
  MagicLinkTokenRelations
> {
  public readonly user: BelongsToAccessor<User, typeof MagicLinkToken.prototype.id>;

  constructor(
    @inject('datasources.postgresDS') dataSource: PostgresDataSource,
    @repository.getter('UserRepository')
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(MagicLinkToken, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter);
    this.registerInclusionResolver('user', this.user.inclusionResolver);
  }

  /**
   * Find valid token (not expired, not used)
   */
  async findValidToken(token: string): Promise<MagicLinkToken | null> {
    const tokens = await this.find({
      where: {
        token,
        expiresAt: {gt: new Date()},
        usedAt: {eq: null},
      },
      limit: 1,
    });
    return tokens.length > 0 ? tokens[0] : null;
  }

  /**
   * Mark token as used
   */
  async markAsUsed(tokenId: string): Promise<void> {
    await this.updateById(tokenId, {usedAt: new Date()});
  }

  /**
   * Delete expired tokens (cleanup)
   */
  async deleteExpiredTokens(): Promise<number> {
    const deleted = await this.deleteAll({
      expiresAt: {lt: new Date()},
    });
    return deleted.count;
  }

  /**
   * Delete all tokens for a user (e.g., on logout)
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const deleted = await this.deleteAll({userId});
    return deleted.count;
  }
}
