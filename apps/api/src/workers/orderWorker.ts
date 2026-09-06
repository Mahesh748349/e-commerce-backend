import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { getRedisConnectionOptions } from "../config/redis-options.js";
import { logger } from "../lib/logger.js";
import { ORDER_PROCESSING_QUEUE, type OrderProcessingJob } from "../queues/orderQueue.js";
import { PaymentService } from "../services/payment.service.js";

const paymentService = new PaymentService();

export const orderWorker = new Worker<OrderProcessingJob>(
  ORDER_PROCESSING_QUEUE,
  async (job) => {
    logger.info("order.worker.started", { jobId: job.id, name: job.name, data: job.data });

    // Keep side effects outside the checkout transaction. The order row is the durable source
    // of truth; this worker can be retried safely by BullMQ if email/payment providers are down.
    await paymentService.verifyOrderPayment(job.data.orderId, job.data.paymentProvider);

    // TODO: add email receipt, fulfillment sync, analytics, and fraud review jobs here.
    logger.info("order.worker.completed", { jobId: job.id, orderId: job.data.orderId });
  },
  {
    connection: getRedisConnectionOptions(env.REDIS_URL),
    concurrency: 8
  }
);

orderWorker.on("failed", (job, error) => {
  logger.error("order.worker.failed", {
    jobId: job?.id,
    orderId: job?.data.orderId,
    error
  });
});
