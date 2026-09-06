import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
      requestId: req.requestId
    }
  });
};
