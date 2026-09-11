import { config } from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

config({ path: "../../.env" });
config();

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
    where: { slug: "fashion" },
    update: {},
    create: {
      name: "Fashion & Apparel",
      slug: "fashion",
      description: "Clothing, footwear, and accessories"
    }
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: {
      name: "Electronics",
      slug: "electronics",
      description: "Laptops, audio, and gadgets"
    }
  });

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: {
      name: "Mobiles & Tablets",
      slug: "mobiles",
      description: "Smartphones and tablets"
    }
  });

  const food = await prisma.category.upsert({
    where: { slug: "food-delivery" },
    update: {},
    create: {
      name: "Food & Groceries",
      slug: "food-delivery",
      description: "Instant food delivery and gourmet meals"
    }
  });

  const items = [
    {
      category: electronics,
      name: "Apple MacBook Pro 14\" M3 Max",
      slug: "apple-macbook-pro-14",
      description: "Lightning-fast Apple M3 chip, 18GB Unified Memory, Liquid Retina XDR display, up to 22h battery life.",
      sku: "MBP14-M3-SLV",
      stock: 14,
      price: 149900,
      attrs: { color: "Space Gray", storage: "512GB" }
    },
    {
      category: electronics,
      name: "Sony WH-1000XM5 Wireless ANC Headphones",
      slug: "sony-wh-1000xm5",
      description: "Industry-leading noise canceling with two processors, 8 microphones, and ultra-comfortable lightweight design.",
      sku: "SONY-XM5-BLK",
      stock: 28,
      price: 34900,
      attrs: { color: "Midnight Black" }
    },
    {
      category: mobiles,
      name: "Apple iPhone 16 Pro Max 256GB",
      slug: "iphone-16-pro-max",
      description: "Grade 5 Titanium design, A18 Pro chip, 48MP Fusion camera system with 5x Telephoto zoom.",
      sku: "IP16P-MAX-256",
      stock: 20,
      price: 119900,
      attrs: { color: "Natural Titanium" }
    },
    {
      category: mobiles,
      name: "Samsung Galaxy S24 Ultra AI Edition",
      slug: "samsung-s24-ultra",
      description: "200MP camera, built-in S Pen, Snapdragon 8 Gen 3 for Galaxy, and Galaxy AI photo assist.",
      sku: "S24U-512-TI",
      stock: 15,
      price: 109900,
      attrs: { color: "Titanium Gray" }
    },
    {
      category: electronics,
      name: "Ultra AMOLED Smartwatch Series 9",
      slug: "ultra-smartwatch-9",
      description: "Always-On Retina display, ECG monitor, blood oxygen tracking, water resistant to 50 meters.",
      sku: "WATCH-S9-45",
      stock: 35,
      price: 29900,
      attrs: { size: "45mm", band: "Ocean Blue" }
    },
    {
      category: apparel,
      name: "Heavyweight Fleece Streetwear Hoodie",
      slug: "heavyweight-streetwear-hoodie",
      description: "450 GSM French Terry cotton hoodie with reinforced ribbed cuffs, kangaroo pocket, and drop-shoulder fit.",
      sku: "HOODIE-BLK-L",
      stock: 42,
      price: 6999,
      attrs: { size: "L", color: "Onyx Black" }
    },
    {
      category: apparel,
      name: "Nike Air Zoom Athletic Running Sneakers",
      slug: "nike-air-zoom-running",
      description: "Responsive Zoom Air cushioning, breathable engineered mesh upper, and high-traction rubber waffle outsole.",
      sku: "NIKE-ZOOM-RED-10",
      stock: 25,
      price: 12900,
      attrs: { size: "US 10", color: "Crimson Red" }
    },
    {
      category: food,
      name: "Italian Truffle & Mushroom Artisan Pizza",
      slug: "italian-truffle-artisan-pizza",
      description: "Fresh wood-fired 12\" sourdough crust topped with San Marzano tomatoes, fresh buffalo mozzarella, and black truffle oil.",
      sku: "FOOD-PIZZA-TRUF",
      stock: 50,
      price: 2199,
      attrs: { size: "12 inch", crust: "Sourdough" }
    },
    {
      category: food,
      name: "Royal Hyderabadi Mutton Dum Biryani",
      slug: "royal-hyderabadi-dum-biryani",
      description: "Slow-cooked aromatic basmati rice layered with tender spiced mutton, caramelized onions, saffron, and fresh mint.",
      sku: "FOOD-BIRYANI-HYD",
      stock: 60,
      price: 2499,
      attrs: { portion: "Serves 2-3" }
    },
    {
      category: food,
      name: "Gourmet Double Angus Cheeseburger",
      slug: "gourmet-double-angus-burger",
      description: "Double 100% prime Angus beef patties, aged cheddar, crisp lettuce, house brioche bun, and hand-cut truffle parmesan fries.",
      sku: "FOOD-BURGER-ANGUS",
      stock: 45,
      price: 1699,
      attrs: { sides: "Truffle Fries" }
    },
    {
      category: electronics,
      name: "Mechanical Tactile Gaming Keyboard RGB",
      slug: "rgb-mechanical-gaming-keyboard",
      description: "Hot-swappable brown switches, per-key RGB backlighting, sound-dampening gasket mount, and aluminum frame.",
      sku: "KB-MECH-RGB-BRN",
      stock: 30,
      price: 8999,
      attrs: { switch: "Brown Tactile" }
    },
    {
      category: apparel,
      name: "Minimalist Italian Chronograph Watch",
      slug: "minimalist-chronograph-watch",
      description: "Surgical-grade stainless steel casing, sapphire crystal scratch-resistant glass, and genuine full-grain leather strap.",
      sku: "WATCH-CHRONO-BRN",
      stock: 19,
      price: 14900,
      attrs: { strap: "Brown Leather" }
    }
  ];

  for (const item of items) {
    const prod = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        categoryId: item.category.id,
        name: item.name,
        description: item.description
      },
      create: {
        categoryId: item.category.id,
        name: item.name,
        slug: item.slug,
        description: item.description
      }
    });

    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {
        stockCount: item.stock,
        priceCents: item.price
      },
      create: {
        productId: prod.id,
        sku: item.sku,
        stockCount: item.stock,
        priceCents: item.price,
        currency: "USD",
        attributes: item.attrs
      }
    });
  }
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
