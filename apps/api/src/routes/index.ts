import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { cartRouter } from "./cart.routes.js";
import { catalogAdminRouter } from "./catalog-admin.routes.js";
import { orderRouter } from "./order.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { productRouter } from "./product.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/catalog/admin", catalogAdminRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
