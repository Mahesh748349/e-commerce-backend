import type { RequestHandler } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validate-request.js";
import { InventoryService } from "../services/inventory.service.js";

const inventoryCreateSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(2).max(80),
  stockCount: z.number().int().nonnegative(),
  priceCents: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  attributes: z.record(z.unknown()).optional()
});

const inventoryUpdateSchema = inventoryCreateSchema
  .omit({ productId: true })
  .partial()
  .extend({
    attributes: z.record(z.unknown()).nullable().optional()
  });

export class InventoryController {
  private readonly inventoryService = new InventoryService();

  listByProduct: RequestHandler = async (req, res, next) => {
    try {
      const items = await this.inventoryService.listByProduct(req.params.productId as string);
      res.status(200).json({ data: items });
    } catch (error) {
      next(error);
    }
  };

  create: RequestHandler[] = [
    validateRequest({ body: inventoryCreateSchema }),
    async (req, res, next) => {
      try {
        const item = await this.inventoryService.create(req.body);
        res.status(201).json({ data: item });
      } catch (error) {
        next(error);
      }
    }
  ];

  update: RequestHandler[] = [
    validateRequest({ body: inventoryUpdateSchema }),
    async (req, res, next) => {
      try {
        const item = await this.inventoryService.update(req.params.id as string, req.body);
        res.status(200).json({ data: item });
      } catch (error) {
        next(error);
      }
    }
  ];

  delete: RequestHandler = async (req, res, next) => {
    try {
      await this.inventoryService.delete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
