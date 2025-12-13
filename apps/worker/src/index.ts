import {LottoWorkerApplication} from './application';

async function main() {
  const app = new LottoWorkerApplication();

  console.log('🚀 Starting Lotto Worker...');

  // Boot the application (runs all booters including CronBooter)
  await app.boot();

  console.log('✅ Lotto Worker started successfully');
  console.log('📅 Cron jobs are now running...');

  // Keep the process alive
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Lotto Worker...');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down Lotto Worker...');
    await app.stop();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('❌ Failed to start Lotto Worker:', err);
  process.exit(1);
});
