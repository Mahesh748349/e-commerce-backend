import type { RequestHandler } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service.js";
import { validateRequest } from "../middleware/validate-request.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional().default("CUSTOMER")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export class AuthController {
  private readonly authService = new AuthService();

  register: RequestHandler[] = [
    validateRequest({ body: registerSchema }),
    async (req, res, next) => {
      try {
        const session = await this.authService.register(req.body);
        res.status(201).json({ data: session });
      } catch (error) {
        next(error);
      }
    }
  ];

  login: RequestHandler[] = [
    validateRequest({ body: loginSchema }),
    async (req, res, next) => {
      try {
        const session = await this.authService.login(req.body);
        res.status(200).json({ data: session });
      } catch (error) {
        next(error);
      }
    }
  ];

  refresh: RequestHandler[] = [
    validateRequest({ body: refreshSchema }),
    async (req, res, next) => {
      try {
        const session = await this.authService.refresh(req.body.refreshToken);
        res.status(200).json({ data: session });
      } catch (error) {
        next(error);
      }
    }
  ];

  logout: RequestHandler = async (req, res, next) => {
    try {
      await this.authService.logout(req.user?.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  me: RequestHandler = async (req, res) => {
    res.status(200).json({ data: req.user });
  };
}
