import { OrderStatus, Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { prisma } from "../lib/prisma.js";
import { OrderRepository } from "../repositories/order.repository.js";
import { rabbitMQ } from "../events/rabbitmq.js";

export class OrderService {
  private readonly orderRepository = new OrderRepository();

  async getById(id: string) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    return order;
  }

  async getMineById(id: string, userId: string) {
    const order = await this.orderRepository.findByIdForUser(id, userId);

    if (!order) {
      throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
    }

    return order;
  }

  listMine(userId: string) {
    return this.orderRepository.findManyForUser(userId);
  }

  async listAdmin(input: {
    status?: OrderStatus;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 25, 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.orderRepository.findMany({
        status: input.status,
        userId: input.userId,
        take: pageSize,
        skip
      }),
      this.orderRepository.count({
        status: input.status,
        userId: input.userId
      })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        pageCount: Math.ceil(total / pageSize)
      }
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.getById(id);

    if (order.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED) {
      throw new AppError("Cancelled orders cannot be reopened", StatusCodes.CONFLICT, "ORDER_ALREADY_CANCELLED");
    }

    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        transactions: true
      }
    });
  }

  async cancelMine(id: string, userId: string) {
    const result = await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: { id, userId },
          include: { items: true }
        });

        if (!order) {
          throw new AppError("Order not found", StatusCodes.NOT_FOUND, "ORDER_NOT_FOUND");
        }

        if (order.status !== OrderStatus.PENDING) {
          throw new AppError("Only pending orders can be cancelled", StatusCodes.CONFLICT, "ORDER_CANNOT_BE_CANCELLED");
        }

        for (const item of order.items) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: {
              stockCount: {
                increment: item.quantity
              }
            }
          });
        }

        return tx.order.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
          include: { items: true }
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    void rabbitMQ.publish("order.cancelled", { orderId: id, userId });
    return result;
  }
}
