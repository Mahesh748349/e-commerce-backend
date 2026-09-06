import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.js";
import type { AuthTokenPayload } from "../types/auth.js";

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export function signAccessToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    issuer: "ecommerce-api",
    audience: "ecommerce-web"
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: AuthTokenPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
    issuer: "ecommerce-api",
    audience: "ecommerce-web"
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "ecommerce-api",
    audience: "ecommerce-web"
  }) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "ecommerce-api",
    audience: "ecommerce-web"
  }) as AuthTokenPayload;
}
