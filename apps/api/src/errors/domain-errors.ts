import { StatusCodes } from "http-status-codes";
import { AppError } from "./app-error.js";

export class OutOfStockError extends AppError {
  constructor(sku: string, requested: number) {
    super(
      `Inventory item ${sku} does not have enough stock for quantity ${requested}`,
      StatusCodes.CONFLICT,
      "OUT_OF_STOCK",
      { sku, requested }
    );
  }
}

export class EmptyCartError extends AppError {
  constructor(userId: string) {
    super("Cannot checkout an empty cart", StatusCodes.BAD_REQUEST, "EMPTY_CART", { userId });
  }
}

export class DuplicateWebhookError extends AppError {
  constructor(provider: string, idempotencyKey: string) {
    super("Webhook event already processed", StatusCodes.OK, "DUPLICATE_WEBHOOK", {
      provider,
      idempotencyKey
    });
  }
}
