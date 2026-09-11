import { demoApi } from "./demo-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function isDemoModeActive(): boolean {
  if (DEMO_MODE) return true;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("use_demo_mode") === "true";
  }
  return false;
}

export function setDemoModeActive(enable: boolean): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("use_demo_mode", enable ? "true" : "false");
  }
}

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type ApiError = {
  error?: string | { message?: string };
  message?: string;
};

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "FAILED";

export type InventoryItem = {
  id: string;
  sku: string;
  stockCount: number;
  priceCents: number;
  currency: string;
  attributes: Record<string, unknown> | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  inventoryItems: InventoryItem[];
  imageUrl?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  originalPriceCents?: number;
};

export type Cart = {
  id: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPriceCents: number;
    inventoryItem: InventoryItem;
    product: Product;
  }>;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
};

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  user: {
    email: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
  }>;
};

export type CustomerOrder = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: string;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export type AuthSession = {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "ADMIN" | "CUSTOMER";
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> | ApiError;

  if (!response.ok) {
    const message =
      "message" in body && body.message
        ? body.message
        : "error" in body && typeof body.error === "string"
          ? body.error
          : "error" in body && body.error && typeof body.error === "object" && body.error.message
            ? body.error.message
          : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (body as ApiEnvelope<T>).data;
}

export const api = {
  login(email: string, password: string) {
    if (isDemoModeActive()) {
      return demoApi.login(email);
    }

    return request<AuthSession>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  register(input: { email: string; password: string; firstName?: string; lastName?: string }) {
    if (isDemoModeActive()) {
      return demoApi.login(input.email);
    }

    return request<AuthSession>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  products() {
    if (isDemoModeActive()) {
      return demoApi.products();
    }

    return request<Array<Product & { category?: { name?: string } | string }>>("/api/v1/products").then(
      (prods) =>
        prods.map((p) => ({
          ...p,
          category:
            p.category && typeof p.category === "object"
              ? (p.category as { name?: string }).name ?? undefined
              : (p.category as string | undefined)
        }))
    );
  },

  categories() {
    if (isDemoModeActive()) {
      return demoApi.categories();
    }

    return request<Category[]>("/api/v1/products/categories").catch(() => demoApi.categories());
  },

  cart(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.cart();
    }

    return request<Cart>("/api/v1/cart/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  addCartItem(accessToken: string, inventoryItemId: string, quantity: number) {
    if (isDemoModeActive()) {
      return demoApi.addCartItem(accessToken, inventoryItemId, quantity);
    }

    return request<Cart>("/api/v1/cart/items", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ inventoryItemId, quantity })
    });
  },

  updateCartItem(accessToken: string, cartItemId: string, quantity: number) {
    if (isDemoModeActive()) {
      return demoApi.updateCartItem(accessToken, cartItemId, quantity);
    }

    return request<Cart>(`/api/v1/cart/items/${cartItemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ quantity })
    });
  },

  checkout(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.checkout();
    }

    return request<{ id: string; totalCents: number; currency: string }>("/api/v1/orders/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ paymentProvider: "stripe" })
    });
  },

  createPaymentIntent(accessToken: string, orderId: string) {
    if (isDemoModeActive()) {
      return demoApi.createPaymentIntent(accessToken, orderId);
    }

    return request<{ clientSecret?: string; providerOrderId: string }>(`/api/v1/payments/orders/${orderId}/intent`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        provider: "stripe",
        idempotencyKey: crypto.randomUUID()
      })
    });
  },

  myOrders(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.myOrders();
    }

    return request<CustomerOrder[]>("/api/v1/orders/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  cancelOrder(accessToken: string, orderId: string) {
    if (isDemoModeActive()) {
      return demoApi.cancelOrder(orderId);
    }

    return request<CustomerOrder>(`/api/v1/orders/me/${orderId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  adminCategories(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.adminCategories();
    }

    return request<Category[]>("/api/v1/catalog/admin/categories", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  adminCreateCategory(accessToken: string, input: { name: string; description?: string }) {
    if (isDemoModeActive()) {
      return demoApi.adminCreateCategory(accessToken, input);
    }

    return request<Category>("/api/v1/catalog/admin/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    });
  },

  adminCreateProduct(
    accessToken: string,
    input: { categoryId: string; name: string; description?: string; isActive?: boolean }
  ) {
    if (isDemoModeActive()) {
      return demoApi.adminCreateProduct(accessToken, input);
    }

    return request<Product>("/api/v1/catalog/admin/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    });
  },

  adminCreateInventory(
    accessToken: string,
    input: {
      productId: string;
      sku: string;
      stockCount: number;
      priceCents: number;
      currency: string;
    }
  ) {
    if (isDemoModeActive()) {
      return demoApi.adminCreateInventory(accessToken, input);
    }

    return request<InventoryItem>("/api/v1/catalog/admin/inventory", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    });
  },

  adminOrders(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.adminOrders();
    }

    return request<AdminOrder[]>("/api/v1/orders/admin", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  adminUpdateOrderStatus(accessToken: string, orderId: string, status: OrderStatus) {
    if (isDemoModeActive()) {
      return demoApi.adminUpdateOrderStatus(orderId, status);
    }

    return request<AdminOrder>(`/api/v1/orders/admin/${orderId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ status })
    });
  }
};

export function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amountCents / 100);
}
