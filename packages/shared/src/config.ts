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
    resetDrawsInterval: process.env.DRAWS_RESET_CRON_INTERVAL || 'off',
    // Estonian lotteries
    euroJackpotInterval: process.env.EST_EURO_JACKPOT_CRON_INTERVAL || 'off',
    vikingLottoInterval: process.env.EST_VIKING_LOTTO_CRON_INTERVAL || 'off',
    bingoLottoInterval: process.env.EST_BINGO_LOTTO_CRON_INTERVAL || 'off',
    jokkerLottoInterval: process.env.EST_JOKKER_LOTTO_CRON_INTERVAL || 'off',
    kenoLottoInterval: process.env.EST_KENO_LOTTO_CRON_INTERVAL || 'off',
    // US lotteries (~3 hours after draws)
    powerballInterval: process.env.US_POWERBALL_CRON_INTERVAL || 'off', // Sun,Tue,Thu 7AM UTC
    megaMillionsInterval: process.env.US_MEGA_MILLIONS_CRON_INTERVAL || 'off', // Wed,Sat 7AM UTC
    cash4LifeInterval: process.env.US_CASH4LIFE_CRON_INTERVAL || 'off', // Daily 5AM UTC
    // UK lotteries
    ukEuroMillionsInterval: process.env.UK_EUROMILLIONS_CRON_INTERVAL || 'off', // Tue,Fri
    ukLottoInterval: process.env.UK_LOTTO_CRON_INTERVAL || 'off', // Wed,Sat
    ukThunderballInterval: process.env.UK_THUNDERBALL_CRON_INTERVAL || 'off', // Tue,Wed,Fri,Sat
    ukSetForLifeInterval: process.env.UK_SET_FOR_LIFE_CRON_INTERVAL || 'off', // Mon,Thu
  },
  dataNYGov: {
    baseUrl: 'https://data.ny.gov/resource',
    powerballResourceId: 'd6yy-54nr',
    megaMillionsResourceId: '5xaw-6ayf',
    cash4LifeResourceId: 'kwxv-fwze',
  },
};
