/* eslint-disable camelcase */

// IMPORTANT: Replace these with your actual Stripe Price IDs from the Stripe Dashboard
const STRIPE_PRICE_IDS = {
  PRO: 'price_1SmcYu1FxgcrMpOsIMCe38kf',
  PREMIUM: 'price_1SmcZ61FxgcrMpOszurvtgIy',
};

exports.up = pgm => {
  pgm.sql(`
    UPDATE subscription_tier
    SET stripe_price_id = '${STRIPE_PRICE_IDS.PRO}'
    WHERE code = 'PRO';
  `);

  pgm.sql(`
    UPDATE subscription_tier
    SET stripe_price_id = '${STRIPE_PRICE_IDS.PREMIUM}'
    WHERE code = 'PREMIUM';
  `);
};

exports.down = pgm => {
  pgm.sql(`
    UPDATE subscription_tier
    SET stripe_price_id = NULL
    WHERE code IN ('PRO', 'PREMIUM');
  `);
};
