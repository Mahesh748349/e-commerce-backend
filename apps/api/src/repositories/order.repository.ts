import type { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class OrderRepository {
  private readonly includeOrderDetails = {
    items: true,
    transactions: {
      include: {
        paymentLogs: true
      }
    }
  };

  findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: this.includeOrderDetails
    });
  }

  findByIdForUser(id: string, userId: string) {
    return prisma.order.findFirst({
      where: { id, userId },
      include: this.includeOrderDetails
    });
  }

  findManyForUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  findMany(input: { status?: OrderStatus; userId?: string; take: number; skip: number }) {
    return prisma.order.findMany({
      where: {
        status: input.status,
        userId: input.userId
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: input.take,
      skip: input.skip,
      orderBy: { createdAt: "desc" }
    });
  }

  count(input: { status?: OrderStatus; userId?: string }) {
    return prisma.order.count({
      where: {
        status: input.status,
        userId: input.userId
      }
    });
  }
}
