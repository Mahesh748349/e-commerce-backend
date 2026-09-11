import { createServer } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { rabbitMQ } from "./events/rabbitmq.js";

const server = createServer(app);

async function bootstrap() {
  await prisma.$connect();
  await redis.ping();
  await rabbitMQ.init();

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });
}

async function shutdown(signal: NodeJS.Signals) {
  logger.info(`${signal} received. Closing API server.`);

  server.close(async () => {
    await Promise.allSettled([prisma.$disconnect(), redis.quit(), rabbitMQ.close()]);
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

bootstrap().catch(async (error) => {
  logger.error("Failed to start API", error);
  await Promise.allSettled([prisma.$disconnect(), redis.quit(), rabbitMQ.close()]);
  process.exit(1);
});
