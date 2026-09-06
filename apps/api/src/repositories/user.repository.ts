import { prisma } from "../lib/prisma.js";

export class UserRepository {
  createCustomer(input: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "CUSTOMER",
        cart: {
          create: {}
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true
      }
    });
  }

  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
  }
}
