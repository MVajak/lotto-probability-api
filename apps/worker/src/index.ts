import {LottoWorkerApplication} from './application';

async function main() {
  const app = new LottoWorkerApplication();

  console.log('🚀 Starting Lotto Worker...');

  // Boot the application (runs all booters including CronBooter)
  await app.boot();

  console.log('✅ Lotto Worker started successfully');
  console.log('📅 Cron jobs are now running...');

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down Lotto Worker...');
    await app.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep the process alive - this interval prevents Node.js from exiting
  setInterval(() => {}, 1 << 30);
}

main().catch(err => {
  console.error('❌ Failed to start Lotto Worker:', err);
  process.exit(1);
});
