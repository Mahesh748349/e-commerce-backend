import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requestContext } from "./request-context.js";

function createResponse() {
  return {
    setHeader: vi.fn()
  } as unknown as Response;
}

describe("requestContext", () => {
  it("uses the incoming x-request-id when present", () => {
    const req = {
      header: vi.fn().mockReturnValue("req-123")
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requestContext(req, res, next);

    expect(req.requestId).toBe("req-123");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", "req-123");
    expect(next).toHaveBeenCalledOnce();
  });

  it("generates a request id when the client does not provide one", () => {
    const req = {
      header: vi.fn().mockReturnValue(undefined)
    } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requestContext(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.requestId);
    expect(next).toHaveBeenCalledOnce();
  });
});
