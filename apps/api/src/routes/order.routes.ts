import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";

export const orderRouter = Router();
const controller = new OrderController();

orderRouter.post("/checkout", controller.checkout);
orderRouter.get("/me", controller.listMine);
orderRouter.get("/me/:id", controller.getMineById);
orderRouter.post("/me/:id/cancel", controller.cancelMine);

orderRouter.get("/admin", controller.listAdmin);
orderRouter.get("/admin/:id", controller.getAdminById);
orderRouter.patch("/admin/:id/status", controller.updateStatus);
