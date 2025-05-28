module.exports = {
  require: ['ts-node/register', 'source-map-support/register'],
  extension: ['ts'],
  spec: 'src/**/tests/**/*.test.ts',
  recursive: true,
};
