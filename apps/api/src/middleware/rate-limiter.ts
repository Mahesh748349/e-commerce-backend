import { rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { env } from "../config/env.js";
import { redis } from "../lib/redis.js";

export const redisRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_SECONDS * 1000,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]): Promise<RedisReply> => {
      const [command, ...rest] = args;
      return redis.call(command as string, ...rest) as Promise<RedisReply>;
    }
  })
});
