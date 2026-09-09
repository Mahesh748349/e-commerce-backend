import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { PaymentController } from "./controllers/payment.controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { redisRateLimiter } from "./middleware/rate-limiter.js";
import { requestLogger } from "./middleware/request-logger.js";
import { requestContext } from "./middleware/request-context.js";
import { apiRouter } from "./routes/index.js";
import { HealthService } from "./services/health.service.js";

export const app = express();
const paymentController = new PaymentController();
const healthService = new HealthService();

app.set("trust proxy", 1);

app.use(helmet());
app.use(requestContext);
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"]
  })
);
app.use(requestLogger);
app.use(redisRateLimiter);

// Payment providers sign the exact raw request bytes. This endpoint must be
// registered before express.json so signature verification is not broken.
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  paymentController.handleWebhook
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", async (_req, res, next) => {
  try {
    const health = await healthService.check();
    res.status(health.status === "ok" ? 200 : 503).json(health);
  } catch (error) {
    next(error);
  }
});

app.use("/api/v1", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
