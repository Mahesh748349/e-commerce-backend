import { randomUUID } from "node:crypto";
import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { redis } from "../lib/redis.js";
import { UserRepository } from "../repositories/user.repository.js";
import type { AuthTokenPayload, AuthenticatedUser } from "../types/auth.js";

export type RegisterInput = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export class AuthService {
  private readonly userRepository = new UserRepository();

  async register(input: RegisterInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError("Email is already registered", StatusCodes.CONFLICT, "EMAIL_IN_USE");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.createCustomer({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName
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
