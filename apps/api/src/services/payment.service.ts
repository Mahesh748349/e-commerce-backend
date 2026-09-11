import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { OrderStatus, PaymentStatus, Prisma, Role, type Transaction } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import Stripe from "stripe";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { DuplicateWebhookError } from "../errors/domain-errors.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";

type PaymentProvider = "stripe" | "razorpay";

type WebhookInput = {
  rawBody: Buffer;
  headers: IncomingHttpHeaders;
};

type NormalizedPaymentEvent = {
  provider: PaymentProvider;
  providerEventId: string;
  providerEventType: string;
  idempotencyKey: string;
  status: PaymentStatus;
  orderId?: string;
  providerOrderId?: string;
  stripePaymentIntentId?: string;
  razorpayPaymentId?: string;
  payload: Prisma.InputJsonValue;
};

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export class PaymentService {
  async createPaymentIntent(input: {
    orderId: string;
    userId: string;
    role?: Role;
    provider: PaymentProvider;
    idempotencyKey: string;
  }) {
    const order = await prisma.order.findFirst({
      where: {
        id: input.orderId,
        userId: input.role === Role.ADMIN ? undefined : input.userId
      },
      include: {
        transactions: {
          where: { type: "PAYMENT" },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new AppError("Only pending orders can be paid", 409, "ORDER_NOT_PAYABLE", {
        orderId: order.id,
        status: order.status
      });
    }

    const transaction = order.transactions[0];
    if (!transaction) {
      throw new AppError("Payment transaction was not initialized", 409, "PAYMENT_TRANSACTION_MISSING");
    }

    if (transaction.provider === input.provider && transaction.providerOrderId) {
      return {
        provider: input.provider,
        orderId: order.id,
        providerOrderId: transaction.providerOrderId,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        amountCents: order.totalCents,
        currency: order.currency,
        reused: true
      };
    }

    if (env.PAYMENTS_FAKE_MODE) {
      return this.createFakePaymentIntent({ order, transaction, provider: input.provider });
    }

    if (input.provider === "stripe") {
      return this.createStripePaymentIntent({ order, transaction, idempotencyKey: input.idempotencyKey });
    }

    return this.createRazorpayOrder({ order, transaction, idempotencyKey: input.idempotencyKey });
  }

  async handleWebhook(input: WebhookInput) {
    const event = this.normalizeAndVerifyWebhook(input);

    try {
      return await prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.paymentLog.findFirst({
            where: {
              OR: [
                { providerEventId: event.providerEventId },
                { provider: event.provider, idempotencyKey: event.idempotencyKey }
              ]
            }
          });

          if (duplicate) {
            logger.info("payment.webhook.duplicate_ignored", {
              provider: event.provider,
              providerEventId: event.providerEventId,
              idempotencyKey: event.idempotencyKey
            });

            throw new DuplicateWebhookError(event.provider, event.idempotencyKey);
          }

          const transaction = await this.findRelatedTransaction(tx, event);

          const paymentLog = await tx.paymentLog.create({
            data: {
              transactionId: transaction?.id,
              provider: event.provider,
              providerEventId: event.providerEventId,
              providerOrderId: event.providerOrderId,
              providerEventType: event.providerEventType,
              stripePaymentIntentId: event.stripePaymentIntentId,
              razorpayPaymentId: event.razorpayPaymentId,
              idempotencyKey: event.idempotencyKey,
              status: event.status,
              payload: event.payload
            }
          });

          if (transaction) {
            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                status: event.status,
                provider: event.provider,
                providerOrderId: event.providerOrderId ?? transaction.providerOrderId,
                stripePaymentIntentId:
                  event.stripePaymentIntentId ?? transaction.stripePaymentIntentId,
                razorpayPaymentId: event.razorpayPaymentId ?? transaction.razorpayPaymentId
              }
            });
          }

          if (event.status === PaymentStatus.SUCCEEDED && transaction?.orderId) {
            await tx.order.updateMany({
              where: {
                id: transaction.orderId,
                status: OrderStatus.PENDING
              },
              data: { status: OrderStatus.PAID }
            });
          }

          if (event.status === PaymentStatus.FAILED && transaction?.orderId) {
            await tx.order.updateMany({
              where: {
                id: transaction.orderId,
                status: OrderStatus.PENDING
              },
              data: { status: OrderStatus.FAILED }
            });
          }

          return {
            accepted: true,
            duplicate: false,
            paymentLogId: paymentLog.id
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );
    } catch (error) {
      if (error instanceof DuplicateWebhookError) {
        return { accepted: true, duplicate: true };
      }

      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        return { accepted: true, duplicate: true };
      }

      throw error;
    }
  }

  async verifyOrderPayment(orderId: string, provider?: PaymentProvider) {
    logger.info("payment.verify_order_payment.queued", { orderId, provider });
  }

  private async createFakePaymentIntent(input: {
    order: { id: string; totalCents: number; currency: string };
    transaction: Transaction;
    provider: PaymentProvider;
  }) {
    const providerOrderId = `${input.provider}_demo_${input.order.id.slice(0, 8)}`;

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: input.transaction.id },
        data: {
          provider: input.provider,
          providerOrderId,
          stripePaymentIntentId: input.provider === "stripe" ? providerOrderId : undefined,
          status: PaymentStatus.SUCCEEDED
        }
      }),
      prisma.order.update({
        where: { id: input.order.id },
        data: {
          status: OrderStatus.PAID
        }
      })
    ]);

    return {
      provider: input.provider,
      orderId: input.order.id,
      providerOrderId,
      clientSecret: `${providerOrderId}_secret`,
      amountCents: input.order.totalCents,
      currency: input.order.currency,
      reused: false
    };
  }

  private async createStripePaymentIntent(input: {
    order: { id: string; userId: string; totalCents: number; currency: string };
    transaction: Transaction;
    idempotencyKey: string;
  }) {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: input.order.totalCents,
        currency: input.order.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: input.order.id,
          userId: input.order.userId,
          idempotencyKey: input.idempotencyKey
        }
      },
      {
        idempotencyKey: input.idempotencyKey
      }
    );

    await prisma.transaction.update({
      where: { id: input.transaction.id },
      data: {
        provider: "stripe",
        providerOrderId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        idempotencyKey: input.idempotencyKey,
        status: this.toStripePaymentStatus(paymentIntent.status)
      }
    });

    return {
      provider: "stripe" as const,
      orderId: input.order.id,
      providerOrderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amountCents: input.order.totalCents,
      currency: input.order.currency,
      reused: false
    };
  }

  private async createRazorpayOrder(input: {
    order: { id: string; userId: string; totalCents: number; currency: string };
    transaction: Transaction;
    idempotencyKey: string;
  }) {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: input.order.totalCents,
        currency: input.order.currency,
        receipt: input.order.id,
        notes: {
          orderId: input.order.id,
          userId: input.order.userId,
          idempotencyKey: input.idempotencyKey
        }
      })
    });

    if (!response.ok) {
      throw new AppError("Failed to create Razorpay order", 502, "RAZORPAY_ORDER_FAILED", {
        status: response.status
      });
    }

    const razorpayOrder = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    await prisma.transaction.update({
      where: { id: input.transaction.id },
      data: {
        provider: "razorpay",
        providerOrderId: razorpayOrder.id,
        idempotencyKey: input.idempotencyKey,
        status: PaymentStatus.REQUIRES_CONFIRMATION
      }
    });

    return {
      provider: "razorpay" as const,
      orderId: input.order.id,
      providerOrderId: razorpayOrder.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      amountCents: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      reused: false
    };
  }

  private normalizeAndVerifyWebhook(input: WebhookInput): NormalizedPaymentEvent {
    if (input.headers["stripe-signature"]) {
      return this.normalizeStripeWebhook(input);
    }

    if (input.headers["x-razorpay-signature"]) {
      return this.normalizeRazorpayWebhook(input);
    }

    throw new AppError("Unknown payment webhook provider", 400, "UNKNOWN_PAYMENT_PROVIDER");
  }

  private normalizeStripeWebhook(input: WebhookInput): NormalizedPaymentEvent {
    const signature = input.headers["stripe-signature"];

    if (typeof signature !== "string") {
      throw new AppError("Missing Stripe signature", 400, "MISSING_STRIPE_SIGNATURE");
    }

    const event = stripe.webhooks.constructEvent(
      input.rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const idempotencyKey =
      paymentIntent.metadata?.idempotencyKey ?? paymentIntent.id ?? event.id;

    return {
      provider: "stripe",
      providerEventId: event.id,
      providerEventType: event.type,
      idempotencyKey,
      orderId: paymentIntent.metadata?.orderId,
      providerOrderId: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      status: this.toStripePaymentStatus(paymentIntent.status),
      payload: event as unknown as Prisma.InputJsonValue
    };
  }

  private normalizeRazorpayWebhook(input: WebhookInput): NormalizedPaymentEvent {
    const signature = input.headers["x-razorpay-signature"];

    if (typeof signature !== "string") {
      throw new AppError("Missing Razorpay signature", 400, "MISSING_RAZORPAY_SIGNATURE");
    }

    const expectedSignature = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(input.rawBody)
      .digest("hex");

    if (!this.constantTimeEquals(signature, expectedSignature)) {
      throw new AppError("Invalid Razorpay signature", 400, "INVALID_RAZORPAY_SIGNATURE");
    }

    const event = JSON.parse(input.rawBody.toString("utf8")) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            status?: string;
            notes?: {
              orderId?: string;
              idempotencyKey?: string;
            };
          };
        };
      };
      id?: string;
    };

    const payment = event.payload?.payment?.entity;
    const providerEventId = event.id ?? `${event.event}:${payment?.id}`;
    const idempotencyKey = payment?.notes?.idempotencyKey ?? payment?.id ?? providerEventId;

    return {
      provider: "razorpay",
      providerEventId,
      providerEventType: event.event,
      idempotencyKey,
      orderId: payment?.notes?.orderId,
      providerOrderId: payment?.order_id,
      razorpayPaymentId: payment?.id,
      status: this.toRazorpayPaymentStatus(payment?.status),
      payload: event as Prisma.InputJsonValue
    };
  }

  private async findRelatedTransaction(
    tx: Prisma.TransactionClient,
    event: NormalizedPaymentEvent
  ): Promise<Transaction | null> {
    if (event.orderId) {
      return tx.transaction.findFirst({
        where: {
          orderId: event.orderId,
          type: "PAYMENT"
        },
        orderBy: { createdAt: "desc" }
      });
    }

    const paymentIdentifiers: Prisma.TransactionWhereInput[] = [
      { idempotencyKey: event.idempotencyKey }
    ];

    if (event.stripePaymentIntentId) {
      paymentIdentifiers.push({ stripePaymentIntentId: event.stripePaymentIntentId });
    }

    if (event.razorpayPaymentId) {
      paymentIdentifiers.push({ razorpayPaymentId: event.razorpayPaymentId });
    }

    if (event.providerOrderId) {
      paymentIdentifiers.push({ providerOrderId: event.providerOrderId });
    }

    return tx.transaction.findFirst({
      where: { OR: paymentIdentifiers },
      orderBy: { createdAt: "desc" }
    });
  }

  private toStripePaymentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case "requires_payment_method":
        return PaymentStatus.REQUIRES_PAYMENT_METHOD;
      case "requires_confirmation":
        return PaymentStatus.REQUIRES_CONFIRMATION;
      case "requires_action":
        return PaymentStatus.REQUIRES_ACTION;
      case "processing":
        return PaymentStatus.PROCESSING;
      case "succeeded":
        return PaymentStatus.SUCCEEDED;
      case "canceled":
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.FAILED;
    }
  }

  private toRazorpayPaymentStatus(status?: string): PaymentStatus {
    switch (status) {
      case "captured":
      case "authorized":
        return PaymentStatus.SUCCEEDED;
      case "created":
        return PaymentStatus.REQUIRES_CONFIRMATION;
      case "failed":
        return PaymentStatus.FAILED;
      case "refunded":
        return PaymentStatus.CANCELED;
      default:
        return PaymentStatus.PROCESSING;
    }
  }

  private constantTimeEquals(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
