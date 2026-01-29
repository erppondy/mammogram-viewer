// Redis configuration - Currently not used (using in-memory workers instead)
// Uncomment and install ioredis if you want to use Redis-based BullMQ workers

// import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// const redisConfig = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: parseInt(process.env.REDIS_PORT || '6379'),
//   maxRetriesPerRequest: null,
//   retryStrategy: (times: number) => {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   },
// };

export const createRedisConnection = () => {
  // return new Redis(redisConfig);
  throw new Error('Redis not configured. Using in-memory workers instead.');
};

export const testRedisConnection = async (): Promise<boolean> => {
  console.log('Redis not configured. Using in-memory workers instead.');
  return false;
};
