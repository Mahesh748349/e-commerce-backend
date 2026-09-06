import { prisma } from "../lib/prisma.js";

export class CategoryRepository {
  findMany() {
    return prisma.category.findMany({
      include: {
        parent: true,
        children: true
      },
      orderBy: { name: "asc" }
    });
  }

  findById(id: string) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug }
    });
  }

  create(input: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
  }) {
    return prisma.category.create({
      data: input
    });
  }

  update(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
    }
  ) {
    return prisma.category.update({
      where: { id },
      data: input
    });
  }

  delete(id: string) {
    return prisma.category.delete({
      where: { id }
    });
  }
}
