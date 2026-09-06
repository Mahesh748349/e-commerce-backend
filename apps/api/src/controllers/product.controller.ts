import type { RequestHandler } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validate-request.js";
import { ProductService } from "../services/product.service.js";

const productCreateSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(180),
  slug: z.string().min(1).max(220).optional(),
  description: z.string().max(5_000).optional(),
  isActive: z.boolean().optional()
});

const productUpdateSchema = productCreateSchema.partial().extend({
  description: z.string().max(5_000).nullable().optional()
});

export class ProductController {
  private readonly productService = new ProductService();

  list: RequestHandler = async (_req, res, next) => {
    try {
      const products = await this.productService.listActiveProducts();
      res.status(200).json({ data: products });
    } catch (error) {
      next(error);
    }
  };

  getBySlug: RequestHandler = async (req, res, next) => {
    try {
      const product = await this.productService.getBySlug(req.params.slug as string);
      res.status(200).json({ data: product });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler[] = [
    validateRequest({ body: productCreateSchema }),
    async (req, res, next) => {
      try {
        const product = await this.productService.create(req.body);
        res.status(201).json({ data: product });
      } catch (error) {
        next(error);
      }
    }
  ];

  update: RequestHandler[] = [
    validateRequest({ body: productUpdateSchema }),
    async (req, res, next) => {
      try {
        const product = await this.productService.update(req.params.id as string, req.body);
        res.status(200).json({ data: product });
      } catch (error) {
        next(error);
      }
    }
  ];

  delete: RequestHandler = async (req, res, next) => {
    try {
      await this.productService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
