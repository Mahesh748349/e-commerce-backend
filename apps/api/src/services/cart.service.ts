import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { CartRepository } from "../repositories/cart.repository.js";
import { InventoryRepository } from "../repositories/inventory.repository.js";

export class CartService {
  private readonly cartRepository = new CartRepository();
  private readonly inventoryRepository = new InventoryRepository();

  async getByUserId(userId: string) {
    const cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      throw new AppError("Cart not found", StatusCodes.NOT_FOUND, "CART_NOT_FOUND");
    }

    return cart;
  }

  getMine(userId: string) {
    return this.cartRepository.getOrCreateByUserId(userId);
  }

  async addItem(input: { userId: string; inventoryItemId: string; quantity: number }) {
    const inventoryItem = await this.inventoryRepository.findById(input.inventoryItemId);

    if (!inventoryItem) {
      throw new AppError("Inventory item not found", StatusCodes.NOT_FOUND, "INVENTORY_NOT_FOUND");
    }

    if (inventoryItem.stockCount < input.quantity) {
      throw new AppError("Requested quantity is not available", StatusCodes.CONFLICT, "OUT_OF_STOCK", {
        sku: inventoryItem.sku,
        requested: input.quantity,
        available: inventoryItem.stockCount
      });
    }

    return this.cartRepository.addItem({
      userId: input.userId,
      productId: inventoryItem.productId,
      inventoryItemId: inventoryItem.id,
      quantity: input.quantity,
      unitPriceCents: inventoryItem.priceCents
    });
  }

  async updateItemQuantity(input: { userId: string; cartItemId: string; quantity: number }) {
    if (input.quantity < 1) {
      return this.cartRepository.removeItem(input);
    }

    return this.cartRepository.updateItemQuantity(input);
  }

  removeItem(input: { userId: string; cartItemId: string }) {
    return this.cartRepository.removeItem(input);
  }

  clear(userId: string) {
    return this.cartRepository.clear(userId);
  }
}
