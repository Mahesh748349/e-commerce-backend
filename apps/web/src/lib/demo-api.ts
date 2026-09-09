import type {
  AdminOrder,
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
};

const hoodieInventory: InventoryItem = {
  id: "11111111-1111-4111-8111-111111111111",
  sku: "HOODIE-BLK-M",
  stockCount: 25,
  priceCents: 6999,
  currency: "USD",
  attributes: { color: "Black", size: "M" }
};

const earbudsInventory: InventoryItem = {
  id: "22222222-2222-4222-8222-222222222222",
  sku: "EARBUDS-WHT-STD",
  stockCount: 40,
  priceCents: 12999,
  currency: "USD",
  attributes: { color: "White" }
};

const sneakersInventory: InventoryItem = {
  id: "33333333-3333-4333-8333-333333333333",
  sku: "SNEAKER-GRN-9",
  stockCount: 18,
  priceCents: 8999,
  currency: "USD",
  attributes: { color: "Green", size: "9" }
};

export const demoProducts: Product[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    name: "Premium Hoodie",
    slug: "premium-hoodie",
    description: "Heavyweight cotton hoodie with a relaxed fit.",
    inventoryItems: [hoodieInventory]
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "Wireless Earbuds",
    slug: "wireless-earbuds",
    description: "Compact earbuds with active noise cancellation.",
    inventoryItems: [earbudsInventory]
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Runner Sneakers",
    slug: "runner-sneakers",
    description: "Lightweight everyday sneakers with breathable mesh.",
    inventoryItems: [sneakersInventory]
  }
];

const demoCategories: Category[] = [
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    name: "Apparel",
    slug: "apparel",
    description: "Everyday clothing and accessories",
    parentId: null
  },
  {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    name: "Electronics",
    slug: "electronics",
    description: "Devices and accessories",
    parentId: null
  }
];

const demoSession: AuthSession = {
  user: {
    id: "99999999-9999-4999-8999-999999999999",
    email: "customer@example.com",
    firstName: "Customer",
    lastName: "User",
    role: "CUSTOMER"
  },
  tokens: {
    accessToken: "demo-access-token",
    refreshToken: "demo-refresh-token"
  }
};

const demoAdminSession: AuthSession = {
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

function getStore(): DemoStore {
  if (typeof window === "undefined") {
    return {
      cart: { id: "demo-cart", items: [] },
      categories: demoCategories,
      products: demoProducts,
      orders: []
    };
  }

  const stored = window.localStorage.getItem("demo-store");
  if (stored) {
    const parsed = JSON.parse(stored) as Partial<DemoStore>;
    return {
      cart: parsed.cart ?? { id: "demo-cart", items: [] },
      categories: parsed.categories ?? demoCategories,
      products: parsed.products ?? demoProducts,
      orders: parsed.orders ?? []
    };
  }

  return {
    cart: { id: "demo-cart", items: [] },
    categories: demoCategories,
    products: demoProducts,
    orders: []
  };
}

function setStore(store: DemoStore) {
  window.localStorage.setItem("demo-store", JSON.stringify(store));
}

export const demoApi = {
  async login(email?: string) {
    return email === "admin@example.com" ? demoAdminSession : demoSession;
  },

  async products() {
    return getStore().products;
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

    store.orders.push({
      id: orderId,
      status: "PENDING",
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

  async adminOrders() {
    return getStore().orders;
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
