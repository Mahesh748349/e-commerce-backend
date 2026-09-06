import type { RequestHandler } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validate-request.js";
import { CartService } from "../services/cart.service.js";

const addItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive().max(100)
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(100)
});

export class CartController {
  private readonly cartService = new CartService();

  getMine: RequestHandler = async (req, res, next) => {
    try {
      const cart = await this.cartService.getMine(req.user?.id as string);
      res.status(200).json({ data: cart });
    } catch (error) {
      next(error);
    }
  };

  addItem: RequestHandler[] = [
    validateRequest({ body: addItemSchema }),
    async (req, res, next) => {
      try {
        const cart = await this.cartService.addItem({
          userId: req.user?.id as string,
          inventoryItemId: req.body.inventoryItemId,
          quantity: req.body.quantity
        });
        res.status(200).json({ data: cart });
      } catch (error) {
        next(error);
      }
    }
  ];

  updateItem: RequestHandler[] = [
    validateRequest({ body: updateItemSchema }),
    async (req, res, next) => {
      try {
        const cart = await this.cartService.updateItemQuantity({
          userId: req.user?.id as string,
          cartItemId: req.params.itemId as string,
          quantity: req.body.quantity
        });
        res.status(200).json({ data: cart });
      } catch (error) {
        next(error);
      }
    }
  ];

  removeItem: RequestHandler = async (req, res, next) => {
    try {
      const cart = await this.cartService.removeItem({
        userId: req.user?.id as string,
        cartItemId: req.params.itemId as string
      });
      res.status(200).json({ data: cart });
    } catch (error) {
      next(error);
    }
  };

  clear: RequestHandler = async (req, res, next) => {
    try {
      const cart = await this.cartService.clear(req.user?.id as string);
      res.status(200).json({ data: cart });
    } catch (error) {
      next(error);
    }
  };
}
