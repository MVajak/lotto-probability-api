/* eslint-disable camelcase */

exports.up = pgm => {
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

    // Subscription Details
    tier: {
      type: 'varchar(20)',
      notNull: true,
      default: 'free',
      check: "tier IN ('free', 'pro', 'premium')",
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
  pgm.createIndex('subscription', 'tier', {name: 'idx_subscription_tier'});

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_subscription_updated_at BEFORE UPDATE ON "subscription"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = pgm => {
  pgm.dropTrigger('subscription', 'update_subscription_updated_at', {ifExists: true});
  pgm.dropTable('subscription');
};
