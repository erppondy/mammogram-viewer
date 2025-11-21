import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const createRedisConnection = () => {
  return new Redis(redisConfig);
};

export const testRedisConnection = async (): Promise<boolean> => {
  const redis = createRedisConnection();
  try {
    await redis.ping();
    console.log('Redis connection successful');
    await redis.quit();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    await redis.quit();
    return false;
  }
};
