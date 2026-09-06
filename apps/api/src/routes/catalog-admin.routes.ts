import { Role } from "@prisma/client";
import { Router } from "express";
import { CategoryController } from "../controllers/category.controller.js";
import { InventoryController } from "../controllers/inventory.controller.js";
import { ProductController } from "../controllers/product.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const catalogAdminRouter = Router();

const categoryController = new CategoryController();
const productController = new ProductController();
const inventoryController = new InventoryController();

catalogAdminRouter.use(authenticate, authorize(Role.ADMIN));

catalogAdminRouter.get("/categories", categoryController.list);
catalogAdminRouter.post("/categories", categoryController.create);
catalogAdminRouter.patch("/categories/:id", categoryController.update);
catalogAdminRouter.delete("/categories/:id", categoryController.delete);

catalogAdminRouter.post("/products", productController.create);
catalogAdminRouter.patch("/products/:id", productController.update);
catalogAdminRouter.delete("/products/:id", productController.delete);

catalogAdminRouter.get("/products/:productId/inventory", inventoryController.listByProduct);
catalogAdminRouter.post("/inventory", inventoryController.create);
catalogAdminRouter.patch("/inventory/:id", inventoryController.update);
catalogAdminRouter.delete("/inventory/:id", inventoryController.delete);
