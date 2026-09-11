import { Role } from "@prisma/client";
import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

export const userRouter = Router();
const controller = new UserController();

userRouter.get("/", authenticate, authorize(Role.ADMIN), controller.listAll);
userRouter.get("/:id", authenticate, controller.getById);

