import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await hashPassword("AdminPassword123!");
  const customerPasswordHash = await hashPassword("CustomerPassword123!");

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN
    }
  });

  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      firstName: "Customer",
      lastName: "User",
      role: Role.CUSTOMER,
      cart: {
        create: {}
      }
    }
  });

  const apparel = await prisma.category.upsert({
    where: { slug: "apparel" },
    update: {},
    create: {
      name: "Apparel",
      slug: "apparel",
      description: "Everyday clothing and accessories"
    }
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Devices and accessories"
    }
  });

  const hoodie = await prisma.product.upsert({
    where: { slug: "premium-hoodie" },
    update: {},
    create: {
      categoryId: apparel.id,
      name: "Premium Hoodie",
      slug: "premium-hoodie",
      description: "Heavyweight cotton hoodie with a relaxed fit"
    }
  });

  const earbuds = await prisma.product.upsert({
    where: { slug: "wireless-earbuds" },
    update: {},
    create: {
      categoryId: electronics.id,
      name: "Wireless Earbuds",
      slug: "wireless-earbuds",
      description: "Compact earbuds with active noise cancellation"
    }
  });

  await prisma.inventoryItem.upsert({
    where: { sku: "HOODIE-BLK-M" },
    update: {
      stockCount: 25,
      priceCents: 6999
    },
    create: {
      productId: hoodie.id,
      sku: "HOODIE-BLK-M",
      stockCount: 25,
      priceCents: 6999,
      currency: "USD",
      attributes: {
        color: "Black",
        size: "M"
      }
    }
  });

  await prisma.inventoryItem.upsert({
    where: { sku: "EARBUDS-WHT-STD" },
    update: {
      stockCount: 40,
      priceCents: 12999
    },
    create: {
      productId: earbuds.id,
      sku: "EARBUDS-WHT-STD",
      stockCount: 40,
      priceCents: 12999,
      currency: "USD",
      attributes: {
        color: "White"
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
