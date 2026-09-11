import type { RequestHandler } from "express";
import { UserService } from "../services/user.service.js";

export class UserController {
  private readonly userService = new UserService();

  getById: RequestHandler = async (req, res, next) => {
    try {
      const user = await this.userService.getById(req.params.id as string);
      res.status(200).json({ data: user });
    } catch (error) {
      next(error);
    }
  };

  listAll: RequestHandler = async (_req, res, next) => {
    try {
      const users = await this.userService.listAll();
      res.status(200).json({ data: users });
    } catch (error) {
      next(error);
    }
  };
}
