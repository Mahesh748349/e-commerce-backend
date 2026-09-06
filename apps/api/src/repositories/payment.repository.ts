import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class PaymentRepository {
  createLog(input: {
    provider: string;
    providerEventId?: string;
    stripePaymentIntentId?: string;
    razorpayPaymentId?: string;
    idempotencyKey?: string;
    status: Prisma.PaymentLogCreateInput["status"];
    providerEventType?: string;
    payload: Prisma.InputJsonValue;
  }) {
    return prisma.paymentLog.create({
      data: input
    });
  }
}
