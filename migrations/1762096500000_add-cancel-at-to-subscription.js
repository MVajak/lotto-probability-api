/* eslint-disable camelcase */

exports.up = pgm => {
  pgm.addColumn('subscription', {
    cancel_at: {type: 'timestamptz', notNull: false, default: null},
  });
};

exports.down = pgm => {
  pgm.dropColumn('subscription', 'cancel_at');
};
