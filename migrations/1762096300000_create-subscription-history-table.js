/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('subscription_history', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    subscription_id: {
      type: 'uuid',
      notNull: true,
      references: 'subscription',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'user',
      onDelete: 'CASCADE',
    },

    // What Changed
    event_type: {
      type: 'varchar(50)',
      notNull: true,
      check:
        "event_type IN ('created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'trial_started', 'trial_ended', 'payment_failed', 'reactivated')",
    },
    from_tier: {
      type: 'varchar(20)',
      notNull: false,
      default: null,
      check: "from_tier IS NULL OR from_tier IN ('FREE', 'PRO', 'PREMIUM')",
    },
    to_tier: {
      type: 'varchar(20)',
      notNull: true,
      check: "to_tier IN ('FREE', 'PRO', 'PREMIUM')",
    },
    from_status: {
      type: 'varchar(20)',
      notNull: false,
      default: null,
      check: "from_status IS NULL OR from_status IN ('active', 'canceled', 'past_due', 'trialing')",
    },
    to_status: {
      type: 'varchar(20)',
      notNull: true,
      check: "to_status IN ('active', 'canceled', 'past_due', 'trialing')",
    },

    // Why it Changed
    reason: {type: 'text', notNull: false, default: null},
    stripe_event_id: {type: 'varchar(100)', notNull: false, default: null},

    // Metadata
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
  });

  // Indexes
  pgm.createIndex('subscription_history', 'user_id', {name: 'idx_subscription_history_user_id'});
  pgm.createIndex('subscription_history', 'subscription_id', {
    name: 'idx_subscription_history_subscription_id',
  });
  pgm.createIndex('subscription_history', 'created_at', {
    name: 'idx_subscription_history_created_at',
  });
  pgm.createIndex('subscription_history', 'event_type', {
    name: 'idx_subscription_history_event_type',
  });
};

exports.down = pgm => {
  pgm.dropTable('subscription_history');
};
