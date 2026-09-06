import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
        requestId: req.requestId
      }
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId
      }
    });
    return;
  }

  logger.error("Unhandled request error", { requestId: req.requestId, error });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      requestId: req.requestId
    }
  });
};
