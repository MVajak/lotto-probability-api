/* eslint-disable camelcase */

exports.up = pgm => {
  // Update PRO tier: $2.99
  pgm.sql(`
    UPDATE subscription_tier
    SET price = 2.99, stripe_price_id = 'price_1SpQgz1FxgcrMpOsFuFIB1YV'
    WHERE code = 'PRO';
  `);

  // Update PREMIUM tier: $4.49
  pgm.sql(`
    UPDATE subscription_tier
    SET price = 4.49, stripe_price_id = 'price_1SpQen1FxgcrMpOsNlh7HKJ0'
    WHERE code = 'PREMIUM';
  `);
};

exports.down = pgm => {
  // Revert to previous prices (update these if you know the old values)
  pgm.sql(`
    UPDATE subscription_tier
    SET price = 0, stripe_price_id = NULL
    WHERE code = 'PRO';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET price = 0, stripe_price_id = NULL
    WHERE code = 'PREMIUM';
  `);
};
