/* eslint-disable camelcase */

exports.up = pgm => {
  // FREE tier features
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_2_MONTHS", "BASIC_FREQUENCY", "AD_SUPPORTED"]'
    WHERE code = 'FREE';
  `);

  // PRO tier features (includes STATS_2_YEARS, NO_ADS)
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_2_YEARS", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION"]'
    WHERE code = 'PRO';
  `);

  // PREMIUM tier features (includes STATS_5_YEARS, NO_ADS)
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["STATS_5_YEARS", "NO_ADS", "TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION", "MARKOV_CHAIN", "AUTOCORRELATION", "PAIR_ANALYSIS", "MONTE_CARLO", "SEASONAL_PATTERNS"]'
    WHERE code = 'PREMIUM';
  `);
};

exports.down = pgm => {
  pgm.sql(`
    UPDATE subscription_tier
    SET features = '[]'
    WHERE code = 'FREE';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION"]'
    WHERE code = 'PRO';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET features = '["TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION", "MARKOV_CHAIN", "AUTOCORRELATION", "PAIR_ANALYSIS", "MONTE_CARLO", "SEASONAL_PATTERNS"]'
    WHERE code = 'PREMIUM';
  `);
};