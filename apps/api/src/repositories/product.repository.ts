import { prisma } from "../lib/prisma.js";

export class ProductRepository {
  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryItems: true
      }
    });
  }

  findManyActive() {
    return prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        inventoryItems: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        inventoryItems: true
      }
    });
  }

  create(input: {
    categoryId: string;
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
  }) {
    return prisma.product.create({
      data: input,
      include: {
        category: true,
        inventoryItems: true
      }
    });
  }

  update(
    id: string,
    input: {
      categoryId?: string;
      name?: string;
      slug?: string;
      description?: string | null;
      isActive?: boolean;
    }
  ) {
    return prisma.product.update({
      where: { id },
      data: input,
      include: {
        category: true,
        inventoryItems: true
      }
    });
  }

  delete(id: string) {
    return prisma.product.delete({
      where: { id }
    });
  }
}
