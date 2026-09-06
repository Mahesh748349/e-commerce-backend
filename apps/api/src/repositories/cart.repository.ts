import { prisma } from "../lib/prisma.js";

export class CartRepository {
  private readonly includeCartDetails = {
    items: {
      include: {
        product: true,
        inventoryItem: true
      },
      orderBy: {
        createdAt: "asc" as const
      }
    }
  };

  findByUserId(userId: string) {
    return prisma.cart.findUnique({
      where: { userId },
      include: this.includeCartDetails
    });
  }

  getOrCreateByUserId(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: this.includeCartDetails
    });
  }

  async addItem(input: {
    userId: string;
    productId: string;
    inventoryItemId: string;
    quantity: number;
    unitPriceCents: number;
  }) {
    const cart = await prisma.cart.upsert({
      where: { userId: input.userId },
      create: { userId: input.userId },
      update: {}
    });

    await prisma.cartItem.upsert({
      where: {
        cartId_inventoryItemId: {
          cartId: cart.id,
          inventoryItemId: input.inventoryItemId
        }
      },
      create: {
        cartId: cart.id,
        productId: input.productId,
        inventoryItemId: input.inventoryItemId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents
      },
      update: {
        quantity: {
          increment: input.quantity
        },
        unitPriceCents: input.unitPriceCents
      }
    });

    return this.findByUserId(input.userId);
  }

  async updateItemQuantity(input: { userId: string; cartItemId: string; quantity: number }) {
    const cart = await this.getOrCreateByUserId(input.userId);

    await prisma.cartItem.update({
      where: {
        id: input.cartItemId,
        cartId: cart.id
      },
      data: {
        quantity: input.quantity
      }
    });

    return this.findByUserId(input.userId);
  }

  async removeItem(input: { userId: string; cartItemId: string }) {
    const cart = await this.getOrCreateByUserId(input.userId);

    await prisma.cartItem.delete({
      where: {
        id: input.cartItemId,
        cartId: cart.id
      }
    });

    return this.findByUserId(input.userId);
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateByUserId(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return this.findByUserId(userId);
  }
}
