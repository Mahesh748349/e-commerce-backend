import { config } from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

config({ path: "../../.env" });
config();

const prisma = new PrismaClient();

async function main() {
  // Only seed authentic categories, products, and inventory items. Real users create accounts via Amazon-style signup.

  const apparel = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {
      name: "Karnataka Handlooms & Fashion",
      description: "Mysore silk sarees, apparel, and footwear"
    },
    create: {
      name: "Karnataka Handlooms & Fashion",
      slug: "fashion",
      description: "Mysore silk sarees, apparel, and footwear"
    }
  });

  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {
      name: "Electronics & Gadgets",
      description: "Laptops, audio, and accessories"
    },
    create: {
      name: "Electronics & Gadgets",
      slug: "electronics",
      description: "Laptops, audio, and accessories"
    }
  });

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {
      name: "Mobiles & Tablets",
      description: "Smartphones, tablets, and wearables"
    },
    create: {
      name: "Mobiles & Tablets",
      slug: "mobiles",
      description: "Smartphones, tablets, and wearables"
    }
  });

  const food = await prisma.category.upsert({
    where: { slug: "food-delivery" },
    update: {
      name: "Namma Food & Groceries (15m)",
      description: "Authentic Karnataka delicacies, instant food delivery, and filter coffee"
    },
    create: {
      name: "Namma Food & Groceries (15m)",
      slug: "food-delivery",
      description: "Authentic Karnataka delicacies, instant food delivery, and filter coffee"
    }
  });

  const items = [
    {
      category: apparel,
      name: "Traditional Mysore Pure Silk Saree (Gold Zari)",
      slug: "traditional-mysore-silk-saree",
      description: "100% pure Mulberry silk with authentic gold zari border, crafted by master weavers in Mysuru, Karnataka. Geographical Indication (GI) certified.",
      sku: "MYSORE-SILK-MAROON",
      stock: 18,
      price: 1299900,
      attrs: {
        color: "Royal Maroon",
        material: "Pure Silk",
        badge: "GI Tagged Karnataka",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: food,
      name: "Namma Bengaluru Crispy Masala Dosa & Filter Kaapi",
      slug: "bengaluru-masala-dosa-combo",
      description: "Golden crisp ghee roast dosa filled with spiced potato palya, coconut chutney, sambar, and hot traditional tumbler filter coffee. Delivered in 15 mins.",
      sku: "FOOD-BLR-DOSA-KAAPI",
      stock: 100,
      price: 24900,
      attrs: {
        meal: "Combo Meal",
        badge: "⚡ 15m Instant BLR",
        imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: food,
      name: "Coorg Pure Arabica Coffee Beans (Dark Roast)",
      slug: "coorg-arabica-coffee-beans",
      description: "Handpicked shade-grown Arabica coffee beans from the misty hills of Kodagu (Coorg), Karnataka. Rich dark chocolate and caramel notes.",
      sku: "COORG-COFFEE-500G",
      stock: 65,
      price: 59900,
      attrs: {
        weight: "500g",
        roast: "Dark Roast",
        badge: "Estate Fresh Coorg",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: food,
      name: "Traditional Ghee Mysore Pak Sweet Box (500g)",
      slug: "traditional-mysore-pak-box",
      description: "Melt-in-mouth traditional royal sweet originated in the Mysore Palace kitchen. Prepared with pure desi cow ghee, besan, and aromatic cardamom.",
      sku: "SWEET-MYSORE-PAK-500",
      stock: 50,
      price: 49900,
      attrs: {
        weight: "500g",
        badge: "Palace Recipe",
        imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: food,
      name: "Royal Dum Mutton Biryani with Mirchi ka Salan",
      slug: "royal-dum-mutton-biryani",
      description: "Slow-cooked dum biryani with fragrant long-grain basmati, succulent tender spiced mutton, caramelized onions, saffron, and mint. Served with Salan & Raita.",
      sku: "FOOD-BIRYANI-ROYAL",
      stock: 45,
      price: 39900,
      attrs: {
        portion: "Serves 2",
        badge: "Swiggy Top Pick",
        imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: electronics,
      name: "Apple MacBook Pro 14\" M3 Max",
      slug: "apple-macbook-pro-14",
      description: "Lightning-fast Apple M3 Max chip, 36GB Unified Memory, Liquid Retina XDR display, up to 22h battery life. Official Apple India 1-Year Warranty.",
      sku: "MBP14-M3-SLV",
      stock: 14,
      price: 14990000,
      attrs: {
        color: "Space Gray",
        storage: "512GB",
        badge: "Prime Assured",
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: electronics,
      name: "Sony WH-1000XM5 Wireless ANC Headphones",
      slug: "sony-wh-1000xm5",
      description: "Industry-leading noise canceling with two processors, 8 microphones, LDAC audio, and ultra-comfortable lightweight design.",
      sku: "SONY-XM5-BLK",
      stock: 28,
      price: 2999000,
      attrs: {
        color: "Midnight Black",
        badge: "Best Seller",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: mobiles,
      name: "Apple iPhone 16 Pro Max 256GB",
      slug: "iphone-16-pro-max",
      description: "Grade 5 Titanium design, A18 Pro chip, 48MP Fusion camera system with 5x Telephoto zoom. 5G dual SIM (eSIM + physical SIM).",
      sku: "IP16P-MAX-256",
      stock: 20,
      price: 14490000,
      attrs: {
        color: "Natural Titanium",
        badge: "Deal of the Day",
        imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: mobiles,
      name: "Samsung Galaxy S24 Ultra AI Edition",
      slug: "samsung-s24-ultra",
      description: "200MP camera, built-in S Pen, Snapdragon 8 Gen 3 for Galaxy, and Galaxy AI photo assist. Made in India edition.",
      sku: "S24U-512-TI",
      stock: 15,
      price: 12999900,
      attrs: {
        color: "Titanium Gray",
        badge: "Limited Offer",
        imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: electronics,
      name: "Ultra AMOLED Smartwatch Series 9 (BT Calling)",
      slug: "ultra-smartwatch-9",
      description: "Always-On AMOLED display, Bluetooth calling with noise cancellation, heart rate & SpO2 tracking, 50m water resistant.",
      sku: "WATCH-S9-45",
      stock: 35,
      price: 249900,
      attrs: {
        size: "45mm",
        band: "Ocean Blue",
        badge: "Special Deal",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: apparel,
      name: "Bengaluru Streetwear Heavyweight Cotton Hoodie",
      slug: "heavyweight-streetwear-hoodie",
      description: "450 GSM French Terry cotton hoodie with reinforced ribbed cuffs, kangaroo pocket, and relaxed Bengaluru oversized fit.",
      sku: "HOODIE-BLK-L",
      stock: 42,
      price: 199900,
      attrs: {
        size: "L",
        color: "Onyx Black",
        badge: "Trending BLR",
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: apparel,
      name: "Nike Air Zoom Athletic Running Shoes",
      slug: "nike-air-zoom-running",
      description: "Responsive Zoom Air cushioning, breathable engineered mesh upper, and high-traction rubber waffle outsole.",
      sku: "NIKE-ZOOM-RED-10",
      stock: 25,
      price: 799900,
      attrs: {
        size: "UK 9",
        color: "Crimson Red",
        badge: "Best Seller",
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"
      }
    },
    {
      category: electronics,
      name: "RGB Mechanical Tactile Gaming Keyboard",
      slug: "rgb-mechanical-gaming-keyboard",
      description: "Hot-swappable tactile brown switches, per-key RGB backlighting, sound-dampening gasket mount, and aircraft-grade aluminum frame.",
      sku: "KB-MECH-RGB-BRN",
      stock: 30,
      price: 499900,
      attrs: {
        switch: "Brown Tactile",
        badge: "Top Rated",
        imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
      }
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
        priceCents: item.price,
        currency: "INR",
        attributes: item.attrs
      },
      create: {
        productId: prod.id,
        sku: item.sku,
        stockCount: item.stock,
        priceCents: item.price,
        currency: "INR",
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
