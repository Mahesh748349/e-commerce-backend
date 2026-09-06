import type { RequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info("request.completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      requestId: req.requestId
    });
  });

  next();
};
