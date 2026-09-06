import type { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";

export class InventoryService {
  private readonly inventoryRepository = new InventoryRepository();
  private readonly productRepository = new ProductRepository();

  listByProduct(productId: string) {
    return this.inventoryRepository.findByProductId(productId);
  }

  async create(input: {
    productId: string;
    sku: string;
    stockCount: number;
    priceCents: number;
    currency: string;
    attributes?: Prisma.InputJsonValue;
  }) {
    await this.ensureProductExists(input.productId);
    return this.inventoryRepository.create({
      ...input,
      sku: input.sku.trim().toUpperCase(),
      currency: input.currency.toUpperCase()
    });
  }

  async update(
    id: string,
    input: {
      sku?: string;
      stockCount?: number;
      priceCents?: number;
      currency?: string;
      attributes?: Prisma.InputJsonValue | null;
    }
  ) {
    await this.ensureInventoryExists(id);
    return this.inventoryRepository.update(id, {
      ...input,
      sku: input.sku?.trim().toUpperCase(),
      currency: input.currency?.toUpperCase()
    });
  }

  async delete(id: string) {
    await this.ensureInventoryExists(id);
    return this.inventoryRepository.delete(id);
  }

  private async ensureProductExists(productId: string) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND, "PRODUCT_NOT_FOUND");
    }
  }

  private async ensureInventoryExists(id: string) {
    const item = await this.inventoryRepository.findById(id);
    if (!item) {
      throw new AppError("Inventory item not found", StatusCodes.NOT_FOUND, "INVENTORY_NOT_FOUND");
    }
  }
}
