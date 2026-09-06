import type { RequestHandler } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validate-request.js";
import { PaymentService } from "../services/payment.service.js";

const createPaymentIntentSchema = z.object({
  provider: z.enum(["stripe", "razorpay"]),
  idempotencyKey: z.string().min(8)
});

export class PaymentController {
  private readonly paymentService = new PaymentService();

  createPaymentIntent: RequestHandler[] = [
    validateRequest({ body: createPaymentIntentSchema }),
    async (req, res, next) => {
      try {
        const intent = await this.paymentService.createPaymentIntent({
          orderId: req.params.orderId as string,
          userId: req.user?.id as string,
          role: req.user?.role,
          provider: req.body.provider,
          idempotencyKey: req.body.idempotencyKey
        });

        res.status(201).json({ data: intent });
      } catch (error) {
        next(error);
      }
    }
  ];

  handleWebhook: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.paymentService.handleWebhook({
        rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)),
        headers: req.headers
      });

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}
