import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";

export const productRouter = Router();
const controller = new ProductController();

productRouter.get("/", controller.list);
productRouter.get("/:slug", controller.getBySlug);
