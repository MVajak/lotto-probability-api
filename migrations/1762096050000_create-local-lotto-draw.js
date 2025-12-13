/* eslint-disable camelcase */

exports.up = pgm => {
  // Enable UUID extension (if not already enabled by user migration)
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  pgm.createTable('lotto_draw', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    draw_date: {type: 'timestamptz', notNull: true},
    draw_label: {type: 'varchar(255)', notNull: true},
    external_draw_id: {type: 'varchar(255)', notNull: false, defaultValue: null},
    game_type_name: {type: 'varchar(255)', notNull: true},
    created_at: {type: 'timestamptz', notNull: true},
    updated_at: {type: 'timestamptz', notNull: true},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  pgm.createIndex('lotto_draw', ['draw_date', 'game_type_name'], {
    name: 'idx_draw_date_game_type_name',
  });

  // Add unique constraint to prevent duplicate draws
  // Both columns are NOT NULL, so standard unique constraint works
  pgm.addConstraint('lotto_draw', 'unique_draw_label_game', {
    unique: ['draw_label', 'game_type_name'],
  });

  pgm.createTable('lotto_draw_result', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    draw_id: {
      type: 'uuid',
      notNull: true,
      references: 'lotto_draw',
      onDelete: 'CASCADE',
    },
    win_class: {type: 'integer', notNull: false, defaultValue: null},
    winning_number: {type: 'varchar(255)', notNull: true},
    sec_winning_number: {type: 'varchar(255)', notNull: false, defaultValue: null},
    created_at: {type: 'timestamptz', notNull: true},
    updated_at: {type: 'timestamptz', notNull: true},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  // Add unique constraint to prevent duplicate results
  // A result is unique by draw_id, win_class, winning_number, and sec_winning_number
  // NULLS NOT DISTINCT treats NULL values as equal (PostgreSQL 15+)
  pgm.sql(`
    CREATE UNIQUE INDEX unique_draw_result
    ON lotto_draw_result (draw_id, win_class, winning_number, sec_winning_number)
    NULLS NOT DISTINCT;
  `);
};

exports.down = pgm => {
  pgm.sql('DROP INDEX IF EXISTS unique_draw_result;');
  pgm.dropTable('lotto_draw_result');
  pgm.dropConstraint('lotto_draw', 'unique_draw_label_game');
  pgm.dropIndex('lotto_draw', 'idx_draw_date_game_type_name');
  pgm.dropTable('lotto_draw');
};
