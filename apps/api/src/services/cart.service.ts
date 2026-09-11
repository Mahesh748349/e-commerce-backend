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

    const cart = await this.getMine(input.userId);
    const existingItem = cart.items.find((item) => item.inventoryItemId === input.inventoryItemId);
    const requestedQuantity = (existingItem?.quantity ?? 0) + input.quantity;

    if (inventoryItem.stockCount < requestedQuantity) {
      throw new AppError("Requested quantity is not available", StatusCodes.CONFLICT, "OUT_OF_STOCK", {
        sku: inventoryItem.sku,
        requested: requestedQuantity,
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

    const cart = await this.getMine(input.userId);
    const cartItem = cart.items.find((item) => item.id === input.cartItemId);

    if (!cartItem) {
      throw new AppError("Cart item not found", StatusCodes.NOT_FOUND, "CART_ITEM_NOT_FOUND");
    }

    if (cartItem.inventoryItem.stockCount < input.quantity) {
      throw new AppError("Requested quantity is not available", StatusCodes.CONFLICT, "OUT_OF_STOCK", {
        sku: cartItem.inventoryItem.sku,
        requested: input.quantity,
        available: cartItem.inventoryItem.stockCount
      });
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
