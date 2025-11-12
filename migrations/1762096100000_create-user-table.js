/* eslint-disable camelcase */

exports.up = pgm => {
  // Enable UUID extension
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  pgm.createTable('user', {
    // Identity
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    email: {type: 'varchar(255)', notNull: true, unique: true},
    email_verified: {type: 'boolean', notNull: true, default: false},
    user_state: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "user_state IN ('pending', 'active', 'suspended', 'deleted')",
    },

    // Personal Info
    first_name: {type: 'varchar(100)', notNull: false, default: null},
    last_name: {type: 'varchar(100)', notNull: false, default: null},
    avatar_url: {type: 'varchar(500)', notNull: false, default: null},
    phone_number: {type: 'varchar(20)', notNull: false, default: null},
    country: {type: 'varchar(2)', notNull: false, default: null},

    // Preferences
    language: {type: 'varchar(10)', notNull: true, default: 'en'},
    timezone: {type: 'varchar(50)', notNull: true, default: 'UTC'},
    email_notifications: {type: 'boolean', notNull: true, default: true},

    // Activity Tracking
    login_count: {type: 'integer', notNull: true, default: 0},
    last_login_at: {type: 'timestamptz', notNull: false, default: null},
    last_login_ip: {type: 'varchar(45)', notNull: false, default: null},

    // Referral
    referral_code: {type: 'varchar(20)', notNull: false, unique: true, default: null},
    referred_by_user_id: {
      type: 'uuid',
      notNull: false,
      references: 'user',
      onDelete: 'SET NULL',
      default: null,
    },

    // Metadata
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    updated_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  // Indexes
  pgm.createIndex('user', 'email', {name: 'idx_user_email'});
  pgm.createIndex('user', 'referral_code', {name: 'idx_user_referral_code'});
  pgm.createIndex('user', 'created_at', {name: 'idx_user_created_at'});
  pgm.createIndex('user', 'user_state', {name: 'idx_user_state'});
  pgm.createIndex('user', 'email_verified', {name: 'idx_user_email_verified'});

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.sql(`
    CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
};

exports.down = pgm => {
  pgm.dropTrigger('user', 'update_user_updated_at', {ifExists: true});
  pgm.dropFunction('update_updated_at_column', [], {ifExists: true});
  pgm.dropTable('user');
  pgm.sql('DROP EXTENSION IF EXISTS "uuid-ossp"');
};
