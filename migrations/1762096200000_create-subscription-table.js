/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('subscription_tier', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    code: {
      type: 'varchar(20)',
      notNull: true,
      unique: true,
    },
    price: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0,
    },
    features: {
      type: 'jsonb',
      notNull: true,
      default: '[]',
    },
    display_order: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    stripe_price_id: {
      type: 'varchar(100)',
      notNull: false,
      default: null,
    },
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    updated_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
  });

  // Seed subscription tiers (stripe_price_id to be updated manually after Stripe setup)
  pgm.sql(`
    INSERT INTO subscription_tier (code, price, features, display_order, stripe_price_id) VALUES
    ('FREE', 0.00, '[]', 1, NULL),
    ('PRO', 2.49, '["TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION"]', 2, NULL),
    ('PREMIUM', 3.99, '["TIMELINE", "TRENDS", "WILSON_CI", "STD_DEVIATION", "MARKOV_CHAIN", "AUTOCORRELATION", "PAIR_ANALYSIS", "MONTE_CARLO", "SEASONAL_PATTERNS"]', 3, NULL);
  `);

  // Auto-update updated_at trigger for subscription_tier
  pgm.sql(`
    CREATE TRIGGER update_subscription_tier_updated_at BEFORE UPDATE ON "subscription_tier"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create subscription table with tier_id reference
  pgm.createTable('subscription', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true,
      references: 'user',
      onDelete: 'CASCADE',
    },
    tier_id: {
      type: 'uuid',
      notNull: true,
      references: 'subscription_tier',
      onDelete: 'RESTRICT',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
      check: "status IN ('active', 'canceled', 'past_due', 'trialing')",
    },

    // Stripe Integration
    stripe_customer_id: {type: 'varchar(100)', notNull: false, unique: true, default: null},
    stripe_subscription_id: {type: 'varchar(100)', notNull: false, unique: true, default: null},
    stripe_price_id: {type: 'varchar(100)', notNull: false, default: null},

    // Billing
    current_period_start: {type: 'timestamptz', notNull: false, default: null},
    current_period_end: {type: 'timestamptz', notNull: false, default: null},
    cancel_at_period_end: {type: 'boolean', notNull: true, default: false},
    canceled_at: {type: 'timestamptz', notNull: false, default: null},
    trial_ends_at: {type: 'timestamptz', notNull: false, default: null},

    // Metadata
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    updated_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
  });

  // Indexes
  pgm.createIndex('subscription', 'user_id', {name: 'idx_subscription_user_id'});
  pgm.createIndex('subscription', 'stripe_customer_id', {
    name: 'idx_subscription_stripe_customer_id',
  });
  pgm.createIndex('subscription', 'status', {name: 'idx_subscription_status'});
  pgm.createIndex('subscription', 'tier_id', {name: 'idx_subscription_tier_id'});

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "subscription"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = pgm => {
  pgm.dropTrigger('subscription', 'update_subscription_updated_at', {ifExists: true});
  pgm.dropTable('subscription');
  pgm.dropTrigger('subscription_tier', 'update_subscription_tier_updated_at', {ifExists: true});
  pgm.dropTable('subscription_tier');
};
