/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('magic_link_token', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'user',
      onDelete: 'CASCADE',
    },
    token: {type: 'varchar(64)', notNull: true, unique: true},
    expires_at: {type: 'timestamptz', notNull: true},
    used_at: {type: 'timestamptz', notNull: false, default: null},
    ip_address: {type: 'varchar(45)', notNull: false, default: null},
    user_agent: {type: 'text', notNull: false, default: null},
    created_at: {type: 'timestamptz', notNull: true, default: pgm.func('NOW()')},
  });

  // Indexes
  pgm.createIndex('magic_link_token', 'token', {name: 'idx_magic_link_token_token'});
  pgm.createIndex('magic_link_token', 'user_id', {name: 'idx_magic_link_token_user_id'});
  pgm.createIndex('magic_link_token', 'expires_at', {name: 'idx_magic_link_token_expires_at'});

  // Clean up expired tokens automatically (optional - can also do via cron)
  pgm.sql(`
    CREATE OR REPLACE FUNCTION delete_expired_magic_link_tokens()
    RETURNS void AS $$
    BEGIN
      DELETE FROM magic_link_token WHERE expires_at < NOW() - INTERVAL '1 day';
    END;
    $$ LANGUAGE plpgsql;
  `);
};

exports.down = pgm => {
  pgm.dropFunction('delete_expired_magic_link_tokens', [], {ifExists: true});
  pgm.dropTable('magic_link_token');
};
