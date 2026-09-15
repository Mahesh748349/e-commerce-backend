import { randomUUID, randomInt } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { redis } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { UserRepository } from "../repositories/user.repository.js";
import { emailService } from "./email.service.js";
import type { AuthTokenPayload, AuthenticatedUser } from "../types/auth.js";

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: "CUSTOMER" | "ADMIN";
};

export type LoginInput = {
  email: string;
  password: string;
};

export class AuthService {
  private readonly userRepository = new UserRepository();

  async checkEmail(email: string) {
    const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
    return {
      exists: Boolean(user),
      email: email.toLowerCase().trim(),
      firstName: user?.firstName || undefined
    };
  }

  async sendLoginOtp(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError("No account found with this email address. Please create an account.", StatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    const otp = String(randomInt(100000, 1000000));
    const key = `auth:otp:login:${cleanEmail}`;
    await redis.set(key, otp, "EX", 600); // 10 minutes

    const emailSent = await emailService.sendOtpEmail(cleanEmail, otp, user.firstName ?? undefined);

    return {
      message: `Login verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      emailSent,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined
    };
  }

  async verifyLoginOtp(input: { email: string; otp: string }) {
    const cleanEmail = input.email.toLowerCase().trim();
    const key = `auth:otp:login:${cleanEmail}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp) {
      throw new AppError("Verification code has expired or was not requested.", StatusCodes.BAD_REQUEST, "OTP_EXPIRED");
    }

    if (storedOtp !== input.otp.trim()) {
      throw new AppError("Incorrect verification code. Please check and try again.", StatusCodes.BAD_REQUEST, "INVALID_OTP");
    }

    await redis.del(key);

    const user = await this.userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError("User account not found.", StatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    return this.issueSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  }

  async sendSignupOtp(input: RegisterInput) {
    const cleanEmail = input.email.toLowerCase().trim();
    const existingUser = await this.userRepository.findByEmail(cleanEmail);

    if (existingUser) {
      throw new AppError("Email is already registered. Please sign in instead.", StatusCodes.CONFLICT, "EMAIL_IN_USE");
    }

    const otp = String(randomInt(100000, 1000000));
    const passwordHash = await hashPassword(input.password);
    const otpPayload = {
      email: cleanEmail,
      otp,
      passwordHash,
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      role: input.role ?? "CUSTOMER",
      attempts: 0
    };

    const key = `auth:otp:signup:${cleanEmail}`;
    await redis.set(key, JSON.stringify(otpPayload), "EX", 600); // 10 minutes

    const emailSent = await emailService.sendOtpEmail(cleanEmail, otp, input.firstName);

    return {
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      emailSent,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined
    };
  }

  async verifySignupOtp(input: { email: string; otp: string }) {
    const cleanEmail = input.email.toLowerCase().trim();
    const cleanOtp = input.otp.trim();
    const key = `auth:otp:signup:${cleanEmail}`;
    const raw = await redis.get(key);

    if (!raw) {
      throw new AppError("Verification code has expired or was not requested. Please request a new code.", StatusCodes.BAD_REQUEST, "OTP_EXPIRED");
    }

    const payload = JSON.parse(raw) as {
      email: string;
      otp: string;
      passwordHash: string;
      firstName: string | null;
      lastName: string | null;
      role: "CUSTOMER" | "ADMIN";
      attempts: number;
    };

    if (payload.attempts >= 5) {
      await redis.del(key);
      throw new AppError("Too many failed attempts. Please request a new verification code.", StatusCodes.TOO_MANY_REQUESTS, "TOO_MANY_ATTEMPTS");
    }

    if (payload.otp !== cleanOtp) {
      payload.attempts += 1;
      const remainingTtl = await redis.ttl(key);
      if (remainingTtl > 0) {
        await redis.set(key, JSON.stringify(payload), "EX", remainingTtl);
      }
      throw new AppError("Incorrect verification code. Please check and try again.", StatusCodes.BAD_REQUEST, "INVALID_OTP");
    }

    await redis.del(key);

    const existing = await this.userRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new AppError("Email is already registered. Please sign in.", StatusCodes.CONFLICT, "EMAIL_IN_USE");
    }

    const user = await this.userRepository.createUser({
      email: cleanEmail,
      passwordHash: payload.passwordHash,
      firstName: payload.firstName ?? undefined,
      lastName: payload.lastName ?? undefined,
      role: payload.role
    });

    return this.issueSession(user);
  }

  async googleLogin(credential: string) {
    if (!credential) {
      throw new AppError("Google credential token is required", StatusCodes.BAD_REQUEST, "INVALID_CREDENTIAL");
    }

    let email = "";
    let firstName = "";
    let lastName = "";

    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      if (res.ok) {
        const data = (await res.json()) as { email?: string; given_name?: string; family_name?: string; name?: string };
        if (data.email) {
          email = data.email.toLowerCase();
          firstName = data.given_name || data.name || "Google";
          lastName = data.family_name || "User";
        }
      }
    } catch (err) {
      logger.warn("google.verify_token.network_failed", { err });
    }

    if (!email) {
      try {
        const parts = credential.split(".");
        const rawPayload = parts[1];
        if (parts.length === 3 && rawPayload) {
          const decoded = JSON.parse(Buffer.from(rawPayload, "base64").toString("utf-8"));
          if (decoded.email) {
            email = decoded.email.toLowerCase();
            firstName = decoded.given_name || decoded.name || "Google";
            lastName = decoded.family_name || "User";
          }
        }
      } catch {
        // fallback
      }
    }

    if (!email) {
      throw new AppError("Invalid or unverified Google token", StatusCodes.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN");
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      const randomPass = randomUUID() + "Aa1!google";
      const passwordHash = await hashPassword(randomPass);
      user = await this.userRepository.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        role: "CUSTOMER"
      });
    }

    return this.issueSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      role: user.role
    });
  }

  async register(input: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError("Email is already registered", StatusCodes.CONFLICT, "EMAIL_IN_USE");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.createUser({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? "CUSTOMER"
    });

    return this.issueSession(user);
  }

  async login(input: LoginInput) {
    const user = await this.userRepository.findByEmailWithPassword(input.email.toLowerCase());

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await verifyPassword(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw new AppError("Invalid credentials", StatusCodes.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    return this.issueSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const storedTokenVersion = await this.getRefreshTokenVersion(payload.sub);

    if (storedTokenVersion !== payload.tokenVersion) {
      throw new AppError("Refresh token has been revoked", StatusCodes.UNAUTHORIZED, "TOKEN_REVOKED");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new AppError("User is inactive", StatusCodes.UNAUTHORIZED, "USER_INACTIVE");
    }

    return this.issueSession({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });
  }

  async logout(userId: string) {
    await redis.incr(this.refreshTokenVersionKey(userId));
  }

  private async issueSession(user: AuthenticatedUser) {
    const tokenVersion = await this.getOrCreateRefreshTokenVersion(user.id);
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion
    };

    return {
      user,
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload)
      }
    };
  }

  private async getOrCreateRefreshTokenVersion(userId: string) {
    const key = this.refreshTokenVersionKey(userId);
    const existing = await redis.get(key);

    if (existing) {
      return Number(existing);
    }

    const tokenVersion = 1;
    await redis.set(key, String(tokenVersion));
    return tokenVersion;
  }

  private async getRefreshTokenVersion(userId: string) {
    const value = await redis.get(this.refreshTokenVersionKey(userId));
    return value ? Number(value) : 0;
  }

  private refreshTokenVersionKey(userId: string) {
    return `auth:refresh-token-version:${userId || randomUUID()}`;
  }
}
