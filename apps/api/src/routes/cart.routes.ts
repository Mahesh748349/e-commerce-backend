import { Router } from "express";
import { CartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const cartRouter = Router();
const controller = new CartController();

cartRouter.use(authenticate);

cartRouter.get("/me", controller.getMine);
cartRouter.post("/items", controller.addItem);
cartRouter.patch("/items/:itemId", controller.updateItem);
cartRouter.delete("/items/:itemId", controller.removeItem);
cartRouter.delete("/items", controller.clear);
