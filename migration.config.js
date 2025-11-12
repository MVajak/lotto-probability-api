module.exports = {
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/lotto_probability',
  migrationsTable: 'pgmigrations',
  dir: 'migrations',
  direction: 'up',
};
