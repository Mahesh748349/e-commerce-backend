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
  currency: "USD",
  attributes: attr
});

export const demoCategories: Category[] = [
  { id: "cat-all", name: "All Categories", slug: "all", description: "All products", parentId: null },
  { id: "cat-electronics", name: "Electronics", slug: "electronics", description: "Laptops, audio, and gadgets", parentId: null },
  { id: "cat-mobiles", name: "Mobiles & Tablets", slug: "mobiles", description: "Smartphones and tablets", parentId: null },
  { id: "cat-fashion", name: "Fashion & Apparel", slug: "fashion", description: "Clothing, footwear, and accessories", parentId: null },
  { id: "cat-food", name: "Food & Groceries", slug: "food-delivery", description: "Instant food delivery and gourmet meals", parentId: null }
];

export const demoProducts: Product[] = [
  {
    id: "prod-1",
    name: "Apple MacBook Pro 14\" M3 Max",
    slug: "apple-macbook-pro-14",
    description: "Lightning-fast Apple M3 chip, 18GB Unified Memory, Liquid Retina XDR display, up to 22h battery life.",
    category: "Electronics",
    rating: 4.9,
    reviewCount: 1420,
    badge: "Prime Assured",
    originalPriceCents: 169900,
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-1", "MBP14-M3-SLV", 14, 149900, { color: "Space Gray", storage: "512GB" })]
  },
  {
    id: "prod-2",
    name: "Sony WH-1000XM5 Wireless ANC Headphones",
    slug: "sony-wh-1000xm5",
    description: "Industry-leading noise canceling with two processors, 8 microphones, and ultra-comfortable lightweight design.",
    category: "Electronics",
    rating: 4.8,
    reviewCount: 2150,
    badge: "Best Seller",
    originalPriceCents: 39900,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-2", "SONY-XM5-BLK", 28, 34900, { color: "Midnight Black" })]
  },
  {
    id: "prod-3",
    name: "Apple iPhone 16 Pro Max 256GB",
    slug: "iphone-16-pro-max",
    description: "Grade 5 Titanium design, A18 Pro chip, 48MP Fusion camera system with 5x Telephoto zoom.",
    category: "Mobiles & Tablets",
    rating: 4.9,
    reviewCount: 3480,
    badge: "Deal of the Day",
    originalPriceCents: 129900,
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-3", "IP16P-MAX-256", 20, 119900, { color: "Natural Titanium" })]
  },
  {
    id: "prod-4",
    name: "Samsung Galaxy S24 Ultra AI Edition",
    slug: "samsung-s24-ultra",
    description: "200MP camera, built-in S Pen, Snapdragon 8 Gen 3 for Galaxy, and Galaxy AI photo assist.",
    category: "Mobiles & Tablets",
    rating: 4.7,
    reviewCount: 1890,
    badge: "Limited Offer",
    originalPriceCents: 124900,
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-4", "S24U-512-TI", 15, 109900, { color: "Titanium Gray" })]
  },
  {
    id: "prod-5",
    name: "Ultra AMOLED Smartwatch Series 9",
    slug: "ultra-smartwatch-9",
    description: "Always-On Retina display, ECG monitor, blood oxygen tracking, water resistant to 50 meters.",
    category: "Electronics",
    rating: 4.6,
    reviewCount: 940,
    badge: "30% OFF",
    originalPriceCents: 39900,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-5", "WATCH-S9-45", 35, 29900, { size: "45mm", band: "Ocean Blue" })]
  },
  {
    id: "prod-6",
    name: "Heavyweight Fleece Streetwear Hoodie",
    slug: "heavyweight-streetwear-hoodie",
    description: "450 GSM French Terry cotton hoodie with reinforced ribbed cuffs, kangaroo pocket, and drop-shoulder fit.",
    category: "Fashion & Apparel",
    rating: 4.6,
    reviewCount: 620,
    badge: "Trending",
    originalPriceCents: 9999,
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-6", "HOODIE-BLK-L", 42, 6999, { size: "L", color: "Onyx Black" })]
  },
  {
    id: "prod-7",
    name: "Nike Air Zoom Athletic Running Sneakers",
    slug: "nike-air-zoom-running",
    description: "Responsive Zoom Air cushioning, breathable engineered mesh upper, and high-traction rubber waffle outsole.",
    category: "Fashion & Apparel",
    rating: 4.8,
    reviewCount: 2840,
    badge: "Best Seller",
    originalPriceCents: 16000,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-7", "NIKE-ZOOM-RED-10", 25, 12900, { size: "US 10", color: "Crimson Red" })]
  },
  {
    id: "prod-8",
    name: "Italian Truffle & Mushroom Artisan Pizza",
    slug: "italian-truffle-artisan-pizza",
    description: "Fresh wood-fired 12\" sourdough crust topped with San Marzano tomatoes, fresh buffalo mozzarella, and black truffle oil.",
    category: "Food & Groceries",
    rating: 4.9,
    reviewCount: 1450,
    badge: "⚡ 20m Delivery",
    originalPriceCents: 2699,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-8", "FOOD-PIZZA-TRUF", 50, 2199, { size: "12 inch", crust: "Sourdough" })]
  },
  {
    id: "prod-9",
    name: "Royal Hyderabadi Mutton Dum Biryani",
    slug: "royal-hyderabadi-dum-biryani",
    description: "Slow-cooked aromatic basmati rice layered with tender spiced mutton, caramelized onions, saffron, and fresh mint. Served with Mirchi ka Salan & Raita.",
    category: "Food & Groceries",
    rating: 4.9,
    reviewCount: 3200,
    badge: "Swiggy Top Pick",
    originalPriceCents: 3200,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-9", "FOOD-BIRYANI-HYD", 60, 2499, { portion: "Serves 2-3" })]
  },
  {
    id: "prod-10",
    name: "Gourmet Double Angus Cheeseburger",
    slug: "gourmet-double-angus-burger",
    description: "Double 100% prime Angus beef patties, aged cheddar, crisp lettuce, house brioche bun, and hand-cut truffle parmesan fries.",
    category: "Food & Groceries",
    rating: 4.7,
    reviewCount: 890,
    badge: "⚡ Quick Bite",
    originalPriceCents: 2199,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-10", "FOOD-BURGER-ANGUS", 45, 1699, { sides: "Truffle Fries" })]
  },
  {
    id: "prod-11",
    name: "Mechanical Tactile Gaming Keyboard RGB",
    slug: "rgb-mechanical-gaming-keyboard",
    description: "Hot-swappable brown switches, per-key RGB backlighting, sound-dampening gasket mount, and aluminum frame.",
    category: "Electronics",
    rating: 4.7,
    reviewCount: 710,
    badge: "Top Rated",
    originalPriceCents: 11999,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-11", "KB-MECH-RGB-BRN", 30, 8999, { switch: "Brown Tactile" })]
  },
  {
    id: "prod-12",
    name: "Minimalist Italian Chronograph Watch",
    slug: "minimalist-chronograph-watch",
    description: "Surgical-grade stainless steel casing, sapphire crystal scratch-resistant glass, and genuine full-grain leather strap.",
    category: "Fashion & Apparel",
    rating: 4.6,
    reviewCount: 540,
    badge: "Amazon's Choice",
    originalPriceCents: 22000,
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    inventoryItems: [createInventory("inv-12", "WATCH-CHRONO-BRN", 19, 14900, { strap: "Brown Leather" })]
  }
];

export const defaultDemoUsers: AdminUser[] = [
  {
    id: "88888888-8888-4888-8888-888888888888",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    email: "customer@example.com",
    firstName: "Customer",
    lastName: "User",
    role: "CUSTOMER",
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

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

  const stored = window.localStorage.getItem("demo-store");
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
    window.localStorage.setItem("demo-store", JSON.stringify(store));
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

  async login(email?: string): Promise<AuthSession> {
    const store = getStore();
    const cleanEmail = email?.toLowerCase();
    const found = store.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (found) {
      return {
        user: {
          id: found.id,
          email: found.email,
          firstName: found.firstName,
          lastName: found.lastName,
          role: found.role
        },
        tokens: {
          accessToken: `demo-${found.role.toLowerCase()}-${found.id}`,
          refreshToken: `demo-refresh-${found.id}`
        }
      };
    }

    if (cleanEmail === "admin@example.com") {
      return {
        user: {
          id: "88888888-8888-4888-8888-888888888888",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "ADMIN"
        },
        tokens: {
          accessToken: "demo-admin-access-token",
          refreshToken: "demo-admin-refresh-token"
        }
      };
    }

    return {
      user: {
        id: "99999999-9999-4999-8999-999999999999",
        email: cleanEmail ?? "customer@example.com",
        firstName: "Customer",
        lastName: "User",
        role: "CUSTOMER"
      },
      tokens: {
        accessToken: "demo-access-token",
        refreshToken: "demo-refresh-token"
      }
    };
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
      currency: "USD",
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
      currency: "USD"
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
      currency: "USD",
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
