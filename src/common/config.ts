export const config = {
  repository: {
    chunkSize: Number(process.env.REPOSITORY_CHUNK_SIZE) || 500,
  },
  database: {
    url:
      process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/lotto_probability',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5433),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'lotto_probability',
  },
  app: {
    port: Number(process.env.APP_PORT ?? 3000),
    host: process.env.APP_HOST || '127.0.0.1',
  },
  openApiSpec: {
    port: Number(process.env.OPEN_API_SPEC_POST ?? 3000),
    host: process.env.OPEN_API_SPEC_HOST || 'localhost',
  },
  crons: {
    resetDrawsInterval: process.env.DRAWS_RESET_INTERVAL || 'off',
    euroJackpotInterval: process.env.EURO_JACKPOT_CRON_INTERVAL || 'off',
    vikingLottoInterval: process.env.VIKING_LOTTO_CRON_INTERVAL || 'off',
    bingoLottoInterval: process.env.BINGO_LOTTO_CRON_INTERVAL || 'off',
    jokkerLottoInterval: process.env.JOKKER_LOTTO_CRON_INTERVAL || 'off',
    kenoLottoInterval: process.env.KENO_LOTTO_CRON_INTERVAL || 'off',
  },
};
