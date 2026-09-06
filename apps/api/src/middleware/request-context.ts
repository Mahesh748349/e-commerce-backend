import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (req, res, next) => {
  const requestId = req.header("x-request-id") ?? randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};
