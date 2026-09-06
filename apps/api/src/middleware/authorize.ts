import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";

export function authorize(...allowedRoles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", StatusCodes.UNAUTHORIZED, "UNAUTHENTICATED"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("Insufficient permissions", StatusCodes.FORBIDDEN, "FORBIDDEN"));
      return;
    }

    next();
  };
}
