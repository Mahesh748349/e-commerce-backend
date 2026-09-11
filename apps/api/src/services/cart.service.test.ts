import { beforeEach, describe, expect, it, vi } from "vitest";

const repositoryMocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  getOrCreateByUserId: vi.fn(),
  updateItemQuantity: vi.fn(),
  findInventoryById: vi.fn()
}));

vi.mock("../repositories/cart.repository.js", () => ({
  CartRepository: class {
    addItem = repositoryMocks.addItem;
    getOrCreateByUserId = repositoryMocks.getOrCreateByUserId;
    updateItemQuantity = repositoryMocks.updateItemQuantity;
  }
}));

vi.mock("../repositories/inventory.repository.js", () => ({
  InventoryRepository: class {
    findById = repositoryMocks.findInventoryById;
  }
}));

import { CartService } from "./cart.service.js";

const cartWithItem = {
  id: "cart-1",
  items: [
    {
      id: "cart-item-1",
      inventoryItemId: "inventory-1",
      quantity: 2,
      inventoryItem: { sku: "HOODIE-BLK-M", stockCount: 2 }
    }
  ]
};

describe("CartService inventory limits", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    repositoryMocks.getOrCreateByUserId.mockResolvedValue(cartWithItem);
    repositoryMocks.findInventoryById.mockResolvedValue({
      id: "inventory-1",
      productId: "product-1",
      sku: "HOODIE-BLK-M",
      stockCount: 2,
      priceCents: 6999
    });
  });

  it("rejects adding more of an existing item than inventory allows", async () => {
    const service = new CartService();

    await expect(
      service.addItem({ userId: "user-1", inventoryItemId: "inventory-1", quantity: 1 })
    ).rejects.toMatchObject({ code: "OUT_OF_STOCK" });

    expect(repositoryMocks.addItem).not.toHaveBeenCalled();
  });

  it("rejects cart quantity updates that exceed stock", async () => {
    const service = new CartService();

    await expect(
      service.updateItemQuantity({ userId: "user-1", cartItemId: "cart-item-1", quantity: 3 })
    ).rejects.toMatchObject({ code: "OUT_OF_STOCK" });

    expect(repositoryMocks.updateItemQuantity).not.toHaveBeenCalled();
  });
});
