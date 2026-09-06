import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

export class HealthService {
  async check() {
    const [database, cache] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      redis.ping()
    ]);

    return {
      status: database.status === "fulfilled" && cache.status === "fulfilled" ? "ok" : "degraded",
      checks: {
        database: database.status === "fulfilled" ? "ok" : "error",
        redis: cache.status === "fulfilled" ? "ok" : "error"
      }
    };
  }
}
