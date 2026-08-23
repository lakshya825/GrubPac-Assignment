import { emailWorker } from './jobs/queue';

console.log('Worker is starting up...');

// Keep process alive
process.on('SIGINT', async () => {
  console.log('Worker is shutting down...');
  await emailWorker.close();
  process.exit(0);
});
