import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";

export const userRouter = Router();
const controller = new UserController();

userRouter.get("/:id", controller.getById);
