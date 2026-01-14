/* eslint-disable camelcase */

exports.up = pgm => {
  // Create feature_flag table
  pgm.createTable('feature_flag', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    key: {type: 'varchar(100)', notNull: true, unique: true},
    name: {type: 'varchar(255)', notNull: true},
    description: {type: 'text', notNull: false, default: null},
    default_enabled: {type: 'boolean', notNull: true, default: false},
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    updated_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  pgm.createIndex('feature_flag', 'key', {name: 'idx_feature_flag_key'});

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_feature_flag_updated_at BEFORE UPDATE ON "feature_flag"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create feature_flag_override table
  pgm.createTable('feature_flag_override', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    feature_flag_id: {
      type: 'uuid',
      notNull: true,
      references: 'feature_flag',
      onDelete: 'CASCADE',
    },
    user_email: {type: 'varchar(255)', notNull: true},
    enabled: {type: 'boolean', notNull: true},
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    updated_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  // Unique constraint on feature_flag_id + user_email
  pgm.addConstraint('feature_flag_override', 'unique_feature_flag_user_email', {
    unique: ['feature_flag_id', 'user_email'],
  });

  pgm.createIndex('feature_flag_override', 'user_email', {name: 'idx_feature_flag_override_email'});
  pgm.createIndex('feature_flag_override', 'feature_flag_id', {name: 'idx_feature_flag_override_flag_id'});

  // Auto-update updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_feature_flag_override_updated_at BEFORE UPDATE ON "feature_flag_override"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  // Insert initial feature flag: ENABLE_ADS (default true)
  pgm.sql(`
    INSERT INTO feature_flag (key, name, description, default_enabled)
    VALUES ('ENABLE_ADS', 'Enable Advertisements', 'Shows ads in the UI', false);
  `);
};

exports.down = pgm => {
  pgm.dropTrigger('feature_flag_override', 'update_feature_flag_override_updated_at', {ifExists: true});
  pgm.dropTable('feature_flag_override');
  pgm.dropTrigger('feature_flag', 'update_feature_flag_updated_at', {ifExists: true});
  pgm.dropTable('feature_flag');
};
