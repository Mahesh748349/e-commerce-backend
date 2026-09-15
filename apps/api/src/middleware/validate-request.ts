import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";

type Schemas = {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
};

export function validateRequest(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    if (schemas.query) {
      const parsed = schemas.query.parse(req.query);
      try {
        req.query = parsed;
      } catch {
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }
    }

    next();
  };
}
