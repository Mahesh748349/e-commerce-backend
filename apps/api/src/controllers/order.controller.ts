import { OrderStatus, Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validateRequest } from "../middleware/validate-request.js";
import { CheckoutService } from "../services/checkout.service.js";
import { OrderService } from "../services/order.service.js";

const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8).optional(),
  paymentProvider: z.enum(["stripe", "razorpay"]).optional(),
  paymentMethod: z.string().optional(),
  shippingAddress: z.record(z.unknown()).optional(),
  couponCode: z.string().optional()
});

const adminListQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

export class OrderController {
  private readonly orderService = new OrderService();
  private readonly checkoutService = new CheckoutService();

  checkout: RequestHandler[] = [
    authenticate,
    validateRequest({ body: checkoutSchema }),
    async (req, res, next) => {
      try {
        const order = await this.checkoutService.checkout({
          userId: req.user?.id as string,
          ...req.body
        });
        res.status(201).json({ data: order });
      } catch (error) {
        next(error);
      }
    }
  ];

  listMine: RequestHandler[] = [
    authenticate,
    async (req, res, next) => {
      try {
        const orders = await this.orderService.listMine(req.user?.id as string);
        res.status(200).json({ data: orders });
      } catch (error) {
        next(error);
      }
    }
  ];

  getMineById: RequestHandler[] = [
    authenticate,
    async (req, res, next) => {
      try {
        const order = await this.orderService.getMineById(
          req.params.id as string,
          req.user?.id as string
        );
        res.status(200).json({ data: order });
      } catch (error) {
        next(error);
      }
    }
  ];

  cancelMine: RequestHandler[] = [
    authenticate,
    async (req, res, next) => {
      try {
        const order = await this.orderService.cancelMine(
          req.params.id as string,
          req.user?.id as string
        );
        res.status(200).json({ data: order });
      } catch (error) {
        next(error);
      }
    }
  ];

  listAdmin: RequestHandler[] = [
    authenticate,
    authorize(Role.ADMIN),
    validateRequest({ query: adminListQuerySchema }),
    async (req, res, next) => {
      try {
        const result = await this.orderService.listAdmin(req.query);
        res.status(200).json({ data: result.items, meta: result.pagination });
      } catch (error) {
        next(error);
      }
    }
  ];

  getAdminById: RequestHandler[] = [
    authenticate,
    authorize(Role.ADMIN),
    async (req, res, next) => {
      try {
        const order = await this.orderService.getById(req.params.id as string);
        res.status(200).json({ data: order });
      } catch (error) {
        next(error);
      }
    }
  ];

  updateStatus: RequestHandler[] = [
    authenticate,
    authorize(Role.ADMIN),
    validateRequest({ body: updateStatusSchema }),
    async (req, res, next) => {
      try {
        const order = await this.orderService.updateStatus(
          req.params.id as string,
          req.body.status
        );
        res.status(200).json({ data: order });
      } catch (error) {
        next(error);
      }
    }
  ];
}
