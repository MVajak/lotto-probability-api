/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.createTable('lotto_draw', {
    id: {type: 'serial', primaryKey: true},
    draw_date: {type: 'timestamptz', notNull: true},
    draw_label: {type: 'varchar(255)', notNull: true},
    external_draw_id: {type: 'varchar(255)', notNull: true},
    game_type_name: {type: 'varchar(255)', notNull: true},
    created_at: {type: 'timestamptz', notNull: true},
    updated_at: {type: 'timestamptz', notNull: true},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });

  pgm.createIndex('lotto_draw', ['draw_date', 'game_type_name'], {
    name: 'idx_draw_date_game_type_name',
  });

  pgm.createTable('lotto_draw_result', {
    id: {type: 'serial', primaryKey: true},
    draw_id: {
      type: 'integer',
      notNull: true,
      references: 'lotto_draw',
      onDelete: 'CASCADE',
    },
    win_class: {type: 'integer', notNull: false, defaultValue: null},
    winning_number: {type: 'varchar(255)', notNull: true},
    sec_winning_number: {type: 'varchar(255)', notNull: false},
    created_at: {type: 'timestamptz', notNull: true},
    updated_at: {type: 'timestamptz', notNull: true},
    deleted_at: {type: 'timestamptz', notNull: false, default: null},
  });
};

exports.down = pgm => {
  pgm.dropTable('lotto_draw_result');
  pgm.dropIndex('lotto_draw', 'idx_draw_date_game_type_name');
  pgm.dropTable('lotto_draw');
};
