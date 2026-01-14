import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';

import {FeatureFlagRepository, FeatureFlagOverrideRepository} from '@lotto/database';

@injectable({scope: BindingScope.SINGLETON})
export class FeatureFlagService {
  constructor(
    @repository(FeatureFlagRepository)
    private featureFlagRepository: FeatureFlagRepository,
    @repository(FeatureFlagOverrideRepository)
    private featureFlagOverrideRepository: FeatureFlagOverrideRepository,
  ) {}

  /**
   * Check if a feature flag is enabled for a given user email
   * Returns override value if exists, otherwise default value
   */
  async isEnabled(key: string, email: string): Promise<boolean> {
    const flag = await this.featureFlagRepository.findByKey(key);
    if (!flag) return false;

    const override = await this.featureFlagOverrideRepository.findByFlagAndEmail(flag.id, email);
    if (override) return override.enabled;

    return flag.defaultEnabled;
  }

  /**
   * Get all feature flags with user's overrides applied
   * Returns a record of flag key to enabled status
   */
  async getFlags(email: string): Promise<Record<string, boolean>> {
    const flags = await this.featureFlagRepository.findAllActive();
    const overrides = await this.featureFlagOverrideRepository.findByEmail(email);

    const result: Record<string, boolean> = {};
    for (const flag of flags) {
      const override = overrides.find(o => o.featureFlagId === flag.id);
      result[flag.key] = override ? override.enabled : flag.defaultEnabled;
    }
    return result;
  }
}
