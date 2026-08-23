import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import 'dotenv/config';

// Create a reusable Redis connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-notifications', { connection });

// Define the worker that processes the jobs
export const emailWorker = new Worker(
  'email-notifications',
  async (job: Job) => {
    console.log(`[Worker] Processing email job ${job.id} for assignment:`, job.data);
    
    // Mock email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Random failure for testing retries (remove in production)
    if (Math.random() < 0.2) {
      throw new Error('Simulated email sending failure');
    }

    console.log(`[Worker] Successfully processed email job ${job.id}`);
  },
  { 
    connection,
    limiter: {
      max: 50, // Global email rate limit — 50 emails/minute (bonus)
      duration: 60000,
    }
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
