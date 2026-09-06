import type { Role } from "@prisma/client";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
};
