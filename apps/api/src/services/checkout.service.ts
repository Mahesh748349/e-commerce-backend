import { randomUUID } from "node:crypto";
import { OrderStatus, PaymentStatus, Prisma, TransactionType } from "@prisma/client";
import { EmptyCartError, OutOfStockError } from "../errors/domain-errors.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { RedisLockManager, type RedisLock } from "../lib/redis-lock.js";
import { enqueueOrderPlacedJob } from "../queues/orderQueue.js";
import { rabbitMQ } from "../events/rabbitmq.js";

export type CheckoutInput = {
  userId: string;
  idempotencyKey?: string;
  paymentProvider?: "stripe" | "razorpay";
};

export class CheckoutService {
  private readonly lockManager = new RedisLockManager();

  async checkout(input: CheckoutInput) {
    const lockKeys = await this.getInventoryLockKeys(input.userId);
    const locks = await this.acquireInventoryLocks(lockKeys);

    try {
      const order = await prisma.$transaction(
        async (tx) => {
          const cart = await tx.cart.findUnique({
            where: { userId: input.userId },
            include: {
              items: {
                include: {
                  product: true,
                  inventoryItem: true
                }
              }
            }
          });

          if (!cart || cart.items.length === 0) {
            throw new EmptyCartError(input.userId);
          }

          const currency = cart.items[0]?.inventoryItem.currency ?? "INR";
          const totalCents = cart.items.reduce(
            (sum, item) => sum + item.inventoryItem.priceCents * item.quantity,
            0
          );

          const order = await tx.order.create({
            data: {
              userId: input.userId,
              status: OrderStatus.PENDING,
              totalCents,
              currency,
              items: {
                create: cart.items.map((item) => ({
                  productId: item.productId,
                  inventoryItemId: item.inventoryItemId,
                  sku: item.inventoryItem.sku,
                  name: item.product.name,
                  quantity: item.quantity,
                  unitPriceCents: item.inventoryItem.priceCents,
                  lineTotalCents: item.inventoryItem.priceCents * item.quantity
                }))
              }
            },
            include: {
              items: true
            }
          });

          for (const item of cart.items) {
            await this.decrementInventory(tx, {
              inventoryItemId: item.inventoryItemId,
              sku: item.inventoryItem.sku,
              quantity: item.quantity
            });
          }

          await tx.transaction.create({
            data: {
              orderId: order.id,
              userId: input.userId,
              type: TransactionType.PAYMENT,
              status: PaymentStatus.PROCESSING,
              amountCents: totalCents,
              currency,
              idempotencyKey: input.idempotencyKey ?? randomUUID()
            }
          });

          await tx.cartItem.deleteMany({
            where: { cartId: cart.id }
          });

          return order;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      try {
        await enqueueOrderPlacedJob({
          orderId: order.id,
          userId: input.userId,
          paymentProvider: input.paymentProvider
        });

        await rabbitMQ.publish("order.created", {
          orderId: order.id,
          userId: input.userId,
          totalCents: order.totalCents,
          currency: order.currency,
          paymentProvider: input.paymentProvider
        });
      } catch (error) {
        logger.error("checkout.order_queue_enqueue_failed", {
          orderId: order.id,
          userId: input.userId,
          error
        });
      }

      return order;
    } catch (error) {
      // Prisma rolls back every DB write in the transaction on throw. Inventory rollback is
      // therefore automatic for failures that happen before the transaction commits.
      logger.error("checkout.failed.transaction_rolled_back", { userId: input.userId, error });
      throw error;
    } finally {
      await Promise.allSettled(locks.map((lock) => this.lockManager.release(lock)));
    }
  }

  private async getInventoryLockKeys(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: { inventoryItemId: true }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      throw new EmptyCartError(userId);
    }

    return [...new Set(cart.items.map((item) => item.inventoryItemId))]
      .sort()
      .map((inventoryItemId) => `lock:inventory:${inventoryItemId}`);
  }

  private async acquireInventoryLocks(keys: string[]) {
    const locks: RedisLock[] = [];

    try {
      for (const key of keys) {
        locks.push(await this.lockManager.acquire(key, 10_000));
      }

      return locks;
    } catch (error) {
      await Promise.allSettled(locks.map((lock) => this.lockManager.release(lock)));
      throw error;
    }
  }

  private async decrementInventory(
    tx: Prisma.TransactionClient,
    input: { inventoryItemId: string; sku: string; quantity: number }
  ) {
    // Conditional update is the final database-level guard. Redis locks reduce contention,
    // while this WHERE clause prevents overselling even if a worker dies while holding a lock.
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: input.inventoryItemId,
        stockCount: {
          gte: input.quantity
        }
      },
      data: {
        stockCount: {
          decrement: input.quantity
        }
      }
    });

    if (updated.count !== 1) {
      throw new OutOfStockError(input.sku, input.quantity);
    }
  }
}
