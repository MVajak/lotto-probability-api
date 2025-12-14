/* eslint-disable camelcase */

exports.up = pgm => {
  // Rename the table
  pgm.renameTable('magic_link_token', 'otp_token');

  // Rename the indexes (use sql for index renaming)
  pgm.sql(`ALTER INDEX idx_magic_link_token_token RENAME TO idx_otp_token_token`);
  pgm.sql(`ALTER INDEX idx_magic_link_token_user_id RENAME TO idx_otp_token_user_id`);
  pgm.sql(`ALTER INDEX idx_magic_link_token_expires_at RENAME TO idx_otp_token_expires_at`);

  // Update the cleanup function
  pgm.sql(`
    DROP FUNCTION IF EXISTS delete_expired_magic_link_tokens();

    CREATE OR REPLACE FUNCTION delete_expired_otp_tokens()
    RETURNS void AS $$
    BEGIN
      DELETE FROM otp_token WHERE expires_at < NOW() - INTERVAL '1 day';
    END;
    $$ LANGUAGE plpgsql;
  `);
};

exports.down = pgm => {
  // Revert cleanup function
  pgm.sql(`
    DROP FUNCTION IF EXISTS delete_expired_otp_tokens();

    CREATE OR REPLACE FUNCTION delete_expired_magic_link_tokens()
    RETURNS void AS $$
    BEGIN
      DELETE FROM magic_link_token WHERE expires_at < NOW() - INTERVAL '1 day';
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Revert index names
  pgm.sql(`ALTER INDEX idx_otp_token_token RENAME TO idx_magic_link_token_token`);
  pgm.sql(`ALTER INDEX idx_otp_token_user_id RENAME TO idx_magic_link_token_user_id`);
  pgm.sql(`ALTER INDEX idx_otp_token_expires_at RENAME TO idx_magic_link_token_expires_at`);

  // Revert table name
  pgm.renameTable('otp_token', 'magic_link_token');
};
