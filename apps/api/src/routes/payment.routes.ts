import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const paymentRouter = Router();
const controller = new PaymentController();

paymentRouter.get("/health", (_req, res) => {
  res.status(200).json({ data: { status: "ready" } });
});

paymentRouter.post("/orders/:orderId/intent", authenticate, controller.createPaymentIntent);
