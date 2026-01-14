/* eslint-disable camelcase */

exports.up = pgm => {
  // FREE tier: STATS_2_MONTHS -> STATS_5_DRAWS
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_5_DRAWS", "BASIC_FREQUENCY", "AD_SUPPORTED"]'
    WHERE code = 'FREE';
  `);

  // PRO tier: STATS_2_YEARS -> STATS_100_DRAWS
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_100_DRAWS", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION"]'
    WHERE code = 'PRO';
  `);

  // PREMIUM tier: STATS_5_YEARS -> STATS_UNLIMITED
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_UNLIMITED", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION", "MARKOV_CHAIN", "AUTOCORRELATION", "PAIR_ANALYSIS", "MONTE_CARLO", "SEASONAL_PATTERNS"]'
    WHERE code = 'PREMIUM';
  `);
};

exports.down = pgm => {
  // Revert to month-based feature names
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_2_MONTHS", "BASIC_FREQUENCY", "AD_SUPPORTED"]'
    WHERE code = 'FREE';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_2_YEARS", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION"]'
    WHERE code = 'PRO';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_5_YEARS", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION", "MARKOV_CHAIN", "AUTOCORRELATION", "PAIR_ANALYSIS", "MONTE_CARLO", "SEASONAL_PATTERNS"]'
    WHERE code = 'PREMIUM';
  `);
};
