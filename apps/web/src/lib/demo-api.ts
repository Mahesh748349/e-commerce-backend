import type {
  AdminOrder,
  AdminUser,
  AuthSession,
  Cart,
  Category,
  CustomerOrder,
  InventoryItem,
  Product
} from "./api";

type DemoStore = {
  cart: Cart;
  categories: Category[];
  products: Product[];
  orders: AdminOrder[];
  users: AdminUser[];
};

const createInventory = (id: string, sku: string, stock: number, price: number, attr: Record<string, unknown> = {}): InventoryItem => ({
  id,
  sku,
  stockCount: stock,
  priceCents: price,
  currency: "INR",
  attributes: attr
});

export const demoCategories: Category[] = [
  { id: "cat-all", name: "All Departments", slug: "all", description: "All products", parentId: null },
  { id: "cat-electronics", name: "Electronics & Gadgets", slug: "electronics", description: "Laptops, audio, and accessories", parentId: null },
  { id: "cat-mobiles", name: "Mobiles & Tablets", slug: "mobiles", description: "Smartphones, tablets, and wearables", parentId: null },
  { id: "cat-fashion", name: "Karnataka Handlooms & Fashion", slug: "fashion", description: "Mysore silk sarees, apparel, and footwear", parentId: null },
  { id: "cat-food", name: "Namma Food & Groceries (15m)", slug: "food-delivery", description: "Authentic Karnataka delicacies, instant food delivery, and filter coffee", parentId: null }
];

export const demoProducts: Product[] = [
  {
    id: "prod-1",
    name: "Traditional Mysore Pure Silk Saree (Gold Zari)",
    slug: "traditional-mysore-silk-saree",
    description: "100% pure Mulberry silk with authentic gold zari border, crafted by master weavers in Mysuru, Karnataka. Geographical Indication (GI) certified.",
    category: "Karnataka Handlooms & Fashion",
    rating: 4.9,
    reviewCount: 1420,
    badge: "GI Tagged Karnataka",
    originalPriceCents: 1599900,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-1", "MYSORE-SILK-MAROON", 18, 1299900, { color: "Royal Maroon", material: "Pure Silk" })]
  },
  {
    id: "prod-2",
    name: "Namma Bengaluru Crispy Masala Dosa & Filter Kaapi",
    slug: "bengaluru-masala-dosa-combo",
    description: "Golden crisp ghee roast dosa filled with spiced potato palya, coconut chutney, sambar, and hot traditional tumbler filter coffee. Delivered in 15 mins.",
    category: "Namma Food & Groceries (15m)",
    rating: 4.9,
    reviewCount: 4200,
    badge: "⚡ 15m Instant BLR",
    originalPriceCents: 34900,
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-2", "FOOD-BLR-DOSA-KAAPI", 100, 24900, { meal: "Combo Meal", speed: "15 min" })]
  },
  {
    id: "prod-3",
    name: "Coorg Pure Arabica Coffee Beans (Dark Roast)",
    slug: "coorg-arabica-coffee-beans",
    description: "Handpicked shade-grown Arabica coffee beans from the misty hills of Kodagu (Coorg), Karnataka. Rich dark chocolate and caramel notes.",
    category: "Namma Food & Groceries (15m)",
    rating: 4.8,
    reviewCount: 980,
    badge: "Estate Fresh Coorg",
    originalPriceCents: 79900,
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-3", "COORG-COFFEE-500G", 65, 59900, { weight: "500g", roast: "Dark Roast" })]
  },
  {
    id: "prod-4",
    name: "Traditional Ghee Mysore Pak Sweet Box (500g)",
    slug: "traditional-mysore-pak-box",
    description: "Melt-in-mouth traditional royal sweet originated in the Mysore Palace kitchen. Prepared with pure desi cow ghee, besan, and aromatic cardamom.",
    category: "Namma Food & Groceries (15m)",
    rating: 4.9,
    reviewCount: 1850,
    badge: "Palace Recipe",
    originalPriceCents: 64900,
    imageUrl: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-4", "SWEET-MYSORE-PAK-500", 50, 49900, { weight: "500g", style: "Melt-in-mouth" })]
  },
  {
    id: "prod-5",
    name: "Royal Dum Mutton Biryani with Mirchi ka Salan",
    slug: "royal-dum-mutton-biryani",
    description: "Slow-cooked dum biryani with fragrant long-grain basmati, succulent tender spiced mutton, caramelized onions, saffron, and mint. Served with Salan & Raita.",
    category: "Namma Food & Groceries (15m)",
    rating: 4.9,
    reviewCount: 3600,
    badge: "Swiggy Top Pick",
    originalPriceCents: 49900,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-5", "FOOD-BIRYANI-ROYAL", 45, 39900, { portion: "Serves 2" })]
  },
  {
    id: "prod-6",
    name: "Apple MacBook Pro 14\" M3 Max",
    slug: "apple-macbook-pro-14",
    description: "Lightning-fast Apple M3 Max chip, 36GB Unified Memory, Liquid Retina XDR display, up to 22h battery life. Official Apple India 1-Year Warranty.",
    category: "Electronics & Gadgets",
    rating: 4.9,
    reviewCount: 1420,
    badge: "Prime Assured",
    originalPriceCents: 16990000,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-6", "MBP14-M3-SLV", 14, 14990000, { color: "Space Gray", storage: "512GB" })]
  },
  {
    id: "prod-7",
    name: "Sony WH-1000XM5 Wireless ANC Headphones",
    slug: "sony-wh-1000xm5",
    description: "Industry-leading noise canceling with two processors, 8 microphones, LDAC audio, and ultra-comfortable lightweight design.",
    category: "Electronics & Gadgets",
    rating: 4.8,
    reviewCount: 2150,
    badge: "Best Seller",
    originalPriceCents: 3499000,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-7", "SONY-XM5-BLK", 28, 2999000, { color: "Midnight Black" })]
  },
  {
    id: "prod-8",
    name: "Apple iPhone 16 Pro Max 256GB",
    slug: "iphone-16-pro-max",
    description: "Grade 5 Titanium design, A18 Pro chip, 48MP Fusion camera system with 5x Telephoto zoom. 5G dual SIM (eSIM + physical SIM).",
    category: "Mobiles & Tablets",
    rating: 4.9,
    reviewCount: 3480,
    badge: "Deal of the Day",
    originalPriceCents: 15990000,
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-8", "IP16P-MAX-256", 20, 14490000, { color: "Natural Titanium" })]
  },
  {
    id: "prod-9",
    name: "Samsung Galaxy S24 Ultra AI Edition",
    slug: "samsung-s24-ultra",
    description: "200MP camera, built-in S Pen, Snapdragon 8 Gen 3 for Galaxy, and Galaxy AI photo assist. Made in India edition.",
    category: "Mobiles & Tablets",
    rating: 4.7,
    reviewCount: 1890,
    badge: "Limited Offer",
    originalPriceCents: 14499900,
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-9", "S24U-512-TI", 15, 12999900, { color: "Titanium Gray" })]
  },
  {
    id: "prod-10",
    name: "Ultra AMOLED Smartwatch Series 9 (BT Calling)",
    slug: "ultra-smartwatch-9",
    description: "Always-On AMOLED display, Bluetooth calling with noise cancellation, heart rate & SpO2 tracking, 50m water resistant.",
    category: "Electronics & Gadgets",
    rating: 4.6,
    reviewCount: 940,
    badge: "Special Deal",
    originalPriceCents: 499900,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-10", "WATCH-S9-45", 35, 249900, { size: "45mm", band: "Ocean Blue" })]
  },
  {
    id: "prod-11",
    name: "Bengaluru Streetwear Heavyweight Cotton Hoodie",
    slug: "heavyweight-streetwear-hoodie",
    description: "450 GSM French Terry cotton hoodie with reinforced ribbed cuffs, kangaroo pocket, and relaxed Bengaluru oversized fit.",
    category: "Karnataka Handlooms & Fashion",
    rating: 4.6,
    reviewCount: 620,
    badge: "Trending BLR",
    originalPriceCents: 299900,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-11", "HOODIE-BLK-L", 42, 199900, { size: "L", color: "Onyx Black" })]
  },
  {
    id: "prod-12",
    name: "Nike Air Zoom Athletic Running Shoes",
    slug: "nike-air-zoom-running",
    description: "Responsive Zoom Air cushioning, breathable engineered mesh upper, and high-traction rubber waffle outsole.",
    category: "Karnataka Handlooms & Fashion",
    rating: 4.8,
    reviewCount: 2840,
    badge: "Best Seller",
    originalPriceCents: 999900,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-12", "NIKE-ZOOM-RED-10", 25, 799900, { size: "UK 9", color: "Crimson Red" })]
  },
  {
    id: "prod-13",
    name: "RGB Mechanical Tactile Gaming Keyboard",
    slug: "rgb-mechanical-gaming-keyboard",
    description: "Hot-swappable tactile brown switches, per-key RGB backlighting, sound-dampening gasket mount, and aircraft-grade aluminum frame.",
    category: "Electronics & Gadgets",
    rating: 4.7,
    reviewCount: 710,
    badge: "Top Rated",
    originalPriceCents: 699900,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-13", "KB-MECH-RGB-BRN", 30, 499900, { switch: "Brown Tactile" })]
  }
];

export const defaultDemoUsers: AdminUser[] = [];

const DEMO_STORE_STORAGE_KEY = "demo-store-v3-karnataka";

function getStore(): DemoStore {
  if (typeof window === "undefined") {
    return {
      cart: { id: "demo-cart", items: [] },
      categories: demoCategories,
      products: demoProducts,
      orders: [],
      users: defaultDemoUsers
    };
  }

  // Clear older versions to avoid stale currency/catalog
  window.localStorage.removeItem("demo-store");
  window.localStorage.removeItem("demo-store-v2");

  const stored = window.localStorage.getItem(DEMO_STORE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<DemoStore>;
      return {
        cart: parsed.cart ?? { id: "demo-cart", items: [] },
        categories: parsed.categories && parsed.categories.length >= demoCategories.length ? parsed.categories : demoCategories,
        products: parsed.products && parsed.products.length >= demoProducts.length ? parsed.products : demoProducts,
        orders: parsed.orders ?? [],
        users: parsed.users && parsed.users.length ? parsed.users : defaultDemoUsers
      };
    } catch {
      // ignore
    }
  }

  return {
    cart: { id: "demo-cart", items: [] },
    categories: demoCategories,
    products: demoProducts,
    orders: [],
    users: defaultDemoUsers
  };
}

function setStore(store: DemoStore) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_STORE_STORAGE_KEY, JSON.stringify(store));
  }
}

export const demoApi = {
  async register(input: { email: string; password?: string; firstName?: string; lastName?: string; role?: "CUSTOMER" | "ADMIN" }): Promise<AuthSession> {
    const store = getStore();
    const role = input.role ?? "CUSTOMER";
    const existing = store.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    const newUser: AdminUser = existing ?? {
      id: crypto.randomUUID(),
      email: input.email.toLowerCase(),
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (!existing) {
      store.users.unshift(newUser);
      setStore(store);
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      },
      tokens: {
        accessToken: `demo-${newUser.role.toLowerCase()}-${newUser.id}`,
        refreshToken: `demo-refresh-${newUser.id}`
      }
    };
  },

  async login(_email?: string): Promise<AuthSession> {
    throw new Error("Demo login is disabled. Please sign in or create an account with real authentication.");
  },

  async products() {
    return getStore().products;
  },

  async categories() {
    return getStore().categories;
  },

  async cart() {
    return getStore().cart;
  },

  async addCartItem(_accessToken: string, inventoryItemId: string, quantity: number) {
    const store = getStore();
    const product = store.products.find((item) =>
      item.inventoryItems.some((inventory) => inventory.id === inventoryItemId)
    );
    const inventoryItem = product?.inventoryItems.find((item) => item.id === inventoryItemId);

    if (!product || !inventoryItem) {
      throw new Error("Inventory item not found");
    }

    const existingItem = store.cart.items.find((item) => item.inventoryItem.id === inventoryItemId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      store.cart.items.push({
        id: crypto.randomUUID(),
        quantity,
        unitPriceCents: inventoryItem.priceCents,
        inventoryItem,
        product
      });
    }

    setStore(store);
    return store.cart;
  },

  async updateCartItem(_accessToken: string, cartItemId: string, quantity: number) {
    const store = getStore();
    store.cart.items = quantity === 0
      ? store.cart.items.filter((item) => item.id !== cartItemId)
      : store.cart.items.map((item) => (item.id === cartItemId ? { ...item, quantity } : item));
    setStore(store);
    return store.cart;
  },

  async checkout() {
    const orderId = crypto.randomUUID();
    const store = getStore();
    const orderItems = store.cart.items.map((item) => ({
      name: item.product.name,
      sku: item.inventoryItem.sku,
      quantity: item.quantity
    }));
    const totalCents = store.cart.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );

    store.orders.unshift({
      id: orderId,
      status: "PAID",
      totalCents,
      currency: "INR",
      createdAt: new Date().toISOString(),
      user: {
        email: "customer@example.com"
      },
      items: orderItems
    });
    store.cart.items = [];
    setStore(store);

    return {
      id: orderId,
      totalCents,
      currency: "INR"
    };
  },

  async createPaymentIntent(_accessToken: string, orderId: string) {
    return {
      providerOrderId: `pi_demo_${orderId.slice(0, 8)}`,
      clientSecret: "pi_demo_secret"
    };
  },

  async adminUsers(): Promise<AdminUser[]> {
    return getStore().users;
  },

  async adminCategories() {
    return getStore().categories;
  },

  async adminCreateCategory(_accessToken: string, input: { name: string; description?: string }) {
    const store = getStore();
    const category: Category = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      description: input.description ?? null,
      parentId: null
    };
    store.categories.unshift(category);
    setStore(store);
    return category;
  },

  async adminDeleteCategory(_accessToken: string, categoryId: string) {
    const store = getStore();
    store.categories = store.categories.filter((c) => c.id !== categoryId);
    setStore(store);
  },

  async adminCreateProduct(
    _accessToken: string,
    input: { categoryId: string; name: string; description?: string; isActive?: boolean }
  ) {
    const store = getStore();
    const product: Product = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      description: input.description ?? null,
      inventoryItems: []
    };
    store.products.unshift(product);
    setStore(store);
    return product;
  },

  async adminCreateFullProduct(
    _accessToken: string,
    input: {
      categoryId: string;
      name: string;
      description?: string;
      sku: string;
      stockCount: number;
      priceCents: number;
      imageUrl?: string;
      badge?: string;
    }
  ): Promise<Product> {
    const store = getStore();
    const category = store.categories.find((c) => c.id === input.categoryId);
    const categoryName = category?.name ?? "General";
    const productId = crypto.randomUUID();
    const inventoryId = crypto.randomUUID();

    const inventoryItem: InventoryItem = {
      id: inventoryId,
      sku: input.sku,
      stockCount: input.stockCount,
      priceCents: input.priceCents,
      currency: "INR",
      attributes: {
        imageUrl: input.imageUrl,
        badge: input.badge
      }
    };

    const newProduct: Product = {
      id: productId,
      name: input.name,
      slug: `${input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now().toString().slice(-4)}`,
      description: input.description ?? `${input.name} available at Amazon & Flipkart Supermart.`,
      category: categoryName,
      rating: 4.8,
      reviewCount: 42,
      badge: input.badge || "New Arrival",
      originalPriceCents: Math.round(input.priceCents * 1.25),
      imageUrl: input.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      inventoryItems: [inventoryItem]
    };

    store.products.unshift(newProduct);
    setStore(store);
    return newProduct;
  },

  async adminDeleteProduct(_accessToken: string, productId: string) {
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== productId);
    setStore(store);
  },

  async adminCreateInventory(
    _accessToken: string,
    input: {
      productId: string;
      sku: string;
      stockCount: number;
      priceCents: number;
      currency: string;
    }
  ) {
    const store = getStore();
    const inventoryItem: InventoryItem = {
      id: crypto.randomUUID(),
      sku: input.sku,
      stockCount: input.stockCount,
      priceCents: input.priceCents,
      currency: input.currency,
      attributes: null
    };
    store.products = store.products.map((product) =>
      product.id === input.productId
        ? { ...product, inventoryItems: [inventoryItem, ...product.inventoryItems] }
        : product
    );
    setStore(store);
    return inventoryItem;
  },

  async adminUpdateInventory(
    _accessToken: string,
    inventoryItemId: string,
    input: { stockCount?: number; priceCents?: number }
  ) {
    const store = getStore();
    store.products = store.products.map((product) => ({
      ...product,
      inventoryItems: product.inventoryItems.map((inv) => {
        if (inv.id === inventoryItemId) {
          return {
            ...inv,
            stockCount: input.stockCount !== undefined ? input.stockCount : inv.stockCount,
            priceCents: input.priceCents !== undefined ? input.priceCents : inv.priceCents
          };
        }
        return inv;
      })
    }));
    setStore(store);
  },

  async adminOrders() {
    return getStore().orders;
  },

  async adminUpdateOrderStatus(orderId: string, status: AdminOrder["status"]) {
    const store = getStore();
    const order = store.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    order.status = status;
    setStore(store);
    return order;
  },

  async myOrders(): Promise<CustomerOrder[]> {
    return getStore().orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        ...item,
        unitPriceCents: 0,
        lineTotalCents: 0
      }))
    }));
  },

  async cancelOrder(orderId: string): Promise<CustomerOrder> {
    const store = getStore();
    const order = store.orders.find((item) => item.id === orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    order.status = "CANCELLED";
    setStore(store);

    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        ...item,
        unitPriceCents: 0,
        lineTotalCents: 0
      }))
    };
  }
};
