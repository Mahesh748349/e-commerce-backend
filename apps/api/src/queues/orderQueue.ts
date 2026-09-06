import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { getRedisConnectionOptions } from "../config/redis-options.js";

export type OrderProcessingJob = {
  orderId: string;
  userId: string;
  paymentProvider?: "stripe" | "razorpay";
};

export const ORDER_PROCESSING_QUEUE = "order-processing";

export const orderQueue = new Queue<OrderProcessingJob>(ORDER_PROCESSING_QUEUE, {
  connection: getRedisConnectionOptions(env.REDIS_URL),
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2_000
    },
    removeOnComplete: {
      age: 60 * 60,
      count: 1_000
    },
    removeOnFail: {
      age: 24 * 60 * 60
    }
  }
});

export function enqueueOrderPlacedJob(payload: OrderProcessingJob) {
  return orderQueue.add("order.placed", payload, {
    jobId: `order-placed-${payload.orderId}`
  });
}
