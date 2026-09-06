import { StatusCodes } from "http-status-codes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
