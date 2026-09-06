import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export class InventoryRepository {
  findByProductId(productId: string) {
    return prisma.inventoryItem.findMany({
      where: { productId },
      orderBy: { sku: "asc" }
    });
  }

  findById(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id }
    });
  }

  create(input: {
    productId: string;
    sku: string;
    stockCount: number;
    priceCents: number;
    currency: string;
    attributes?: Prisma.InputJsonValue;
  }) {
    return prisma.inventoryItem.create({
      data: input
    });
  }

  update(
    id: string,
    input: {
      sku?: string;
      stockCount?: number;
      priceCents?: number;
      currency?: string;
      attributes?: Prisma.InputJsonValue | null;
    }
  ) {
    const data = {
      ...input,
      attributes: input.attributes === null ? Prisma.JsonNull : input.attributes
    };

    return prisma.inventoryItem.update({
      where: { id },
      data
    });
  }

  delete(id: string) {
    return prisma.inventoryItem.delete({
      where: { id }
    });
  }
}
