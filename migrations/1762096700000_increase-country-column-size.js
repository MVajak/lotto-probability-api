/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.alterColumn('user', 'country', {
    type: 'varchar(100)',
  });
};

exports.down = pgm => {
  pgm.alterColumn('user', 'country', {
    type: 'varchar(2)',
  });
};