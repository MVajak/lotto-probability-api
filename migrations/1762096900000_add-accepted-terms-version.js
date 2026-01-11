/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.addColumn('user', {
    accepted_terms_version: {
      type: 'varchar(10)',
      notNull: false,
      default: null,
    },
    accepted_terms_at: {
      type: 'timestamptz',
      notNull: false,
      default: null,
    },
  });
};

exports.down = pgm => {
  pgm.dropColumn('user', 'accepted_terms_at');
  pgm.dropColumn('user', 'accepted_terms_version');
};