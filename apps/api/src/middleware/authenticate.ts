import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";

export const authenticate: RequestHandler = (req, _res, next) => {
  const authorization = req.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    next(new AppError("Missing bearer token", StatusCodes.UNAUTHORIZED, "UNAUTHENTICATED"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED, "INVALID_TOKEN"));
  }
};
