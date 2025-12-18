module.exports = {
  require: ['ts-node/register', 'source-map-support/register'],
  extension: ['ts'],
  spec: ['packages/*/src/**/tests/**/*.test.ts', 'apps/*/src/**/tests/**/*.test.ts'],
  recursive: true,
};
