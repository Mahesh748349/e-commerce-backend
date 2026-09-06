import { randomUUID } from "node:crypto";
import { redis } from "./redis.js";

const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export type RedisLock = {
  key: string;
  token: string;
};

export class RedisLockManager {
  async acquire(key: string, ttlMs: number, retryCount = 8, retryDelayMs = 75): Promise<RedisLock> {
    const token = randomUUID();

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      const acquired = await redis.set(key, token, "PX", ttlMs, "NX");

      if (acquired === "OK") {
        return { key, token };
      }

      await this.delay(retryDelayMs * (attempt + 1));
    }

    throw new Error(`Unable to acquire Redis lock for ${key}`);
  }

  async release(lock: RedisLock): Promise<void> {
    await redis.eval(RELEASE_LOCK_SCRIPT, 1, lock.key, lock.token);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
