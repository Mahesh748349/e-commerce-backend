import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { slugify } from "../utils/slug.js";

export class ProductService {
  private readonly productRepository = new ProductRepository();
  private readonly categoryRepository = new CategoryRepository();

  async listActiveProducts() {
    return this.productRepository.findManyActive();
  }

  async getBySlug(slug: string) {
    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND, "PRODUCT_NOT_FOUND");
    }

    return product;
  }

  async create(input: {
    categoryId: string;
    name: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }) {
    await this.ensureCategoryExists(input.categoryId);
    const slug = input.slug ?? slugify(input.name);
    await this.ensureSlugAvailable(slug);

    return this.productRepository.create({
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description,
      isActive: input.isActive
    });
  }

  async update(
    id: string,
    input: {
      categoryId?: string;
      name?: string;
      slug?: string;
      description?: string | null;
      isActive?: boolean;
    }
  ) {
    await this.ensureProductExists(id);

    if (input.categoryId) {
      await this.ensureCategoryExists(input.categoryId);
    }

    const slug = input.slug ?? (input.name ? slugify(input.name) : undefined);
    if (slug) {
      const existing = await this.productRepository.findBySlug(slug);
      if (existing && existing.id !== id) {
        throw new AppError("Product slug already exists", StatusCodes.CONFLICT, "PRODUCT_SLUG_EXISTS");
      }
    }

    return this.productRepository.update(id, {
      ...input,
      slug
    });
  }

  async delete(id: string) {
    await this.ensureProductExists(id);
    return this.productRepository.delete(id);
  }

  private async ensureProductExists(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new AppError("Product not found", StatusCodes.NOT_FOUND, "PRODUCT_NOT_FOUND");
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND, "CATEGORY_NOT_FOUND");
    }
  }

  private async ensureSlugAvailable(slug: string) {
    const existing = await this.productRepository.findBySlug(slug);
    if (existing) {
      throw new AppError("Product slug already exists", StatusCodes.CONFLICT, "PRODUCT_SLUG_EXISTS");
    }
  }
}
