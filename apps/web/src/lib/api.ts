import { demoApi } from "./demo-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  inventoryItems: InventoryItem[];
};

export type InventoryItem = {
  id: string;
  sku: string;
  stockCount: number;
  priceCents: number;
  currency: string;
  attributes: Record<string, unknown> | null;
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
  status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "FAILED";
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

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope<T> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(body.error?.message ?? "Request failed");
  }

  return body.data;
}

export const api = {
  login(email: string, password: string) {
    if (DEMO_MODE) {
      return demoApi.login();
    }

    return request<AuthSession>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },

  products() {
    if (DEMO_MODE) {
      return demoApi.products();
    }

    return request<Product[]>("/api/v1/products");
  },

  cart(accessToken: string) {
    if (DEMO_MODE) {
      return demoApi.cart();
    }

    return request<Cart>("/api/v1/cart/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  addCartItem(accessToken: string, inventoryItemId: string, quantity: number) {
    if (DEMO_MODE) {
      return demoApi.addCartItem(accessToken, inventoryItemId, quantity);
    }

    return request<Cart>("/api/v1/cart/items", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ inventoryItemId, quantity })
    });
  },

  updateCartItem(accessToken: string, cartItemId: string, quantity: number) {
    if (DEMO_MODE) {
      return demoApi.updateCartItem(accessToken, cartItemId, quantity);
    }

    return request<Cart>(`/api/v1/cart/items/${cartItemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ quantity })
    });
  },

  checkout(accessToken: string) {
    if (DEMO_MODE) {
      return demoApi.checkout();
    }

    return request<{ id: string; totalCents: number; currency: string }>("/api/v1/orders/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ paymentProvider: "stripe" })
    });
  },

  createPaymentIntent(accessToken: string, orderId: string) {
    if (DEMO_MODE) {
      return demoApi.createPaymentIntent(accessToken, orderId);
    }

    return request<{ clientSecret?: string; providerOrderId: string }>(
      `/api/v1/payments/orders/${orderId}/intent`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          provider: "stripe",
          idempotencyKey: crypto.randomUUID()
        })
      }
    );
  },

  adminCategories(accessToken: string) {
    if (DEMO_MODE) {
      return demoApi.adminCategories();
    }

    return request<Category[]>("/api/v1/catalog/admin/categories", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  },

  adminCreateCategory(accessToken: string, input: { name: string; description?: string }) {
    if (DEMO_MODE) {
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
    if (DEMO_MODE) {
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
    if (DEMO_MODE) {
      return demoApi.adminCreateInventory(accessToken, input);
    }

    return request<InventoryItem>("/api/v1/catalog/admin/inventory", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    });
  },

  adminOrders(accessToken: string) {
    if (DEMO_MODE) {
      return demoApi.adminOrders();
    }

    return request<AdminOrder[]>("/api/v1/orders/admin", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }
};

export function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amountCents / 100);
}
