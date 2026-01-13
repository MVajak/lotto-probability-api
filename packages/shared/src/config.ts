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
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST || '0.0.0.0',
  },
  openApiSpec: {
    port: Number(process.env.OPEN_API_SPEC_POST ?? 3000),
    host: process.env.OPEN_API_SPEC_HOST || 'localhost',
  },
  crons: {
    // Estonian lotteries
    estBingoLottoInterval: process.env.EST_BINGO_LOTTO_CRON_INTERVAL || 'off',
    estJokkerLottoInterval: process.env.EST_JOKKER_LOTTO_CRON_INTERVAL || 'off',
    estKenoLottoInterval: process.env.EST_KENO_LOTTO_CRON_INTERVAL || 'off',
    // US lotteries (~3 hours after draws)
    usPowerballInterval: process.env.US_POWERBALL_CRON_INTERVAL || 'off',
    usMegaMillionsInterval: process.env.US_MEGA_MILLIONS_CRON_INTERVAL || 'off',
    usCash4LifeInterval: process.env.US_CASH4LIFE_CRON_INTERVAL || 'off',
    // UK lotteries
    ukLottoInterval: process.env.UK_LOTTO_CRON_INTERVAL || 'off',
    ukThunderballInterval: process.env.UK_THUNDERBALL_CRON_INTERVAL || 'off',
    ukSetForLifeInterval: process.env.UK_SET_FOR_LIFE_CRON_INTERVAL || 'off',
    ukHotPicksInterval: process.env.UK_HOT_PICKS_CRON_INTERVAL || 'off',
    // Irish lotteries (each interval triggers main + plus variants)
    ieLottoInterval: process.env.IE_LOTTO_CRON_INTERVAL || 'off',
    ieDailyMillionInterval: process.env.IE_DAILY_MILLION_CRON_INTERVAL || 'off',
    // Spanish lotteries
    esLaPrimitivaInterval: process.env.ES_LA_PRIMITIVA_CRON_INTERVAL || 'off',
    esBonolotoInterval: process.env.ES_BONOLOTO_CRON_INTERVAL || 'off',
    esElGordoInterval: process.env.ES_EL_GORDO_CRON_INTERVAL || 'off',
    // German lotteries (Spiel77 and Super6 fetched with 6aus49)
    deLotto6aus49Interval: process.env.DE_LOTTO_6AUS49_CRON_INTERVAL || 'off',
    deKenoInterval: process.env.DE_KENO_CRON_INTERVAL || 'off',
    // Shared lotteries
    euroMillionsInterval: process.env.EUROMILLIONS_CRON_INTERVAL || 'off',
    euroJackpotInterval: process.env.EUROJACKPOT_CRON_INTERVAL || 'off',
    vikingLottoInterval: process.env.VIKINGLOTTO_CRON_INTERVAL || 'off',
    euroDreamsInterval: process.env.EURODREAMS_CRON_INTERVAL || 'off',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
    appName: process.env.APP_NAME || 'LottoLens',
  },
};
