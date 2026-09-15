import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

export const authRouter = Router();
const controller = new AuthController();

authRouter.post("/check-email", controller.checkEmail);
authRouter.post("/login/send-otp", controller.sendLoginOtp);
authRouter.post("/login/verify-otp", controller.verifyLoginOtp);
authRouter.post("/signup/send-otp", controller.sendSignupOtp);
authRouter.post("/signup/verify-otp", controller.verifySignupOtp);
authRouter.post("/google", controller.googleLogin);
authRouter.post("/register", controller.register);
authRouter.post("/login", controller.login);
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", authenticate, controller.logout);
authRouter.get("/me", authenticate, controller.me);
