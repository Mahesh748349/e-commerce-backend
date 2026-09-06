import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { CategoryRepository } from "../repositories/category.repository.js";
import { slugify } from "../utils/slug.js";

export class CategoryService {
  private readonly categoryRepository = new CategoryRepository();

  list() {
    return this.categoryRepository.findMany();
  }

  async create(input: {
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
  }) {
    const slug = input.slug ?? slugify(input.name);
    await this.ensureSlugAvailable(slug);

    if (input.parentId) {
      await this.ensureExists(input.parentId);
    }

    return this.categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
      parentId: input.parentId
    });
  }

  async update(
    id: string,
    input: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: string | null;
    }
  ) {
    await this.ensureExists(id);

    const slug = input.slug ?? (input.name ? slugify(input.name) : undefined);
    if (slug) {
      const existing = await this.categoryRepository.findBySlug(slug);
      if (existing && existing.id !== id) {
        throw new AppError("Category slug already exists", StatusCodes.CONFLICT, "CATEGORY_SLUG_EXISTS");
      }
    }

    if (input.parentId) {
      if (input.parentId === id) {
        throw new AppError("Category cannot be its own parent", StatusCodes.BAD_REQUEST, "INVALID_PARENT_CATEGORY");
      }
      await this.ensureExists(input.parentId);
    }

    return this.categoryRepository.update(id, {
      ...input,
      slug
    });
  }

  async delete(id: string) {
    await this.ensureExists(id);
    return this.categoryRepository.delete(id);
  }

  private async ensureExists(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND, "CATEGORY_NOT_FOUND");
    }
  }

  private async ensureSlugAvailable(slug: string) {
    const existing = await this.categoryRepository.findBySlug(slug);
    if (existing) {
      throw new AppError("Category slug already exists", StatusCodes.CONFLICT, "CATEGORY_SLUG_EXISTS");
    }
  }
}
