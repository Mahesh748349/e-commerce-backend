import type { RequestHandler } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validate-request.js";
import { CategoryService } from "../services/category.service.js";

const categoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160).optional(),
  description: z.string().max(1_000).optional(),
  parentId: z.string().uuid().optional()
});

const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  description: z.string().max(1_000).nullable().optional(),
  parentId: z.string().uuid().nullable().optional()
});

export class CategoryController {
  private readonly categoryService = new CategoryService();

  list: RequestHandler = async (_req, res, next) => {
    try {
      const categories = await this.categoryService.list();
      res.status(200).json({ data: categories });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler[] = [
    validateRequest({ body: categoryCreateSchema }),
    async (req, res, next) => {
      try {
        const category = await this.categoryService.create(req.body);
        res.status(201).json({ data: category });
      } catch (error) {
        next(error);
      }
    }
  ];

  update: RequestHandler[] = [
    validateRequest({ body: categoryUpdateSchema }),
    async (req, res, next) => {
      try {
        const category = await this.categoryService.update(req.params.id as string, req.body);
        res.status(200).json({ data: category });
      } catch (error) {
        next(error);
      }
    }
  ];

  delete: RequestHandler = async (req, res, next) => {
    try {
      await this.categoryService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
