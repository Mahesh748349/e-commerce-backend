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

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "CUSTOMER";
  isActive: boolean;
  createdAt: string;
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

const PRODUCT_IMAGE_FALLBACKS: Record<string, { image: string; badge: string; rating: number; reviews: number }> = {
  "traditional-mysore-silk-saree": {
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    badge: "GI Tagged Karnataka",
    rating: 4.9,
    reviews: 1420
  },
  "coorg-arabica-coffee-beans": {
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    badge: "Estate Fresh Coorg",
    rating: 4.8,
    reviews: 980
  },
  "bengaluru-masala-dosa-combo": {
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    badge: "⚡ 15m Instant BLR",
    rating: 4.9,
    reviews: 4200
  },
  "traditional-mysore-pak-box": {
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    badge: "Palace Recipe",
    rating: 4.9,
    reviews: 1850
  },
  "royal-dum-mutton-biryani": {
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    badge: "Swiggy Top Pick",
    rating: 4.9,
    reviews: 3600
  },
  "apple-macbook-pro-14": {
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    badge: "Prime Assured",
    rating: 4.9,
    reviews: 1420
  },
  "sony-wh-1000xm5": {
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    badge: "Best Seller",
    rating: 4.8,
    reviews: 2150
  },
  "iphone-16-pro-max": {
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
    badge: "Deal of the Day",
    rating: 4.9,
    reviews: 3480
  },
  "samsung-s24-ultra": {
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    badge: "Limited Offer",
    rating: 4.7,
    reviews: 1890
  },
  "ultra-smartwatch-9": {
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    badge: "Special Deal",
    rating: 4.6,
    reviews: 940
  },
  "heavyweight-streetwear-hoodie": {
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    badge: "Trending BLR",
    rating: 4.6,
    reviews: 620
  },
  "nike-air-zoom-running": {
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    badge: "Best Seller",
    rating: 4.8,
    reviews: 2840
  },
  "italian-truffle-artisan-pizza": {
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    badge: "⚡ 20m Delivery",
    rating: 4.9,
    reviews: 1450
  },
  "royal-hyderabadi-dum-biryani": {
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    badge: "Swiggy Top Pick",
    rating: 4.9,
    reviews: 3200
  },
  "gourmet-double-angus-burger": {
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    badge: "⚡ Quick Bite",
    rating: 4.7,
    reviews: 890
  },
  "rgb-mechanical-gaming-keyboard": {
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    badge: "Top Rated",
    rating: 4.7,
    reviews: 710
  },
  "minimalist-chronograph-watch": {
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
    badge: "Amazon's Choice",
    rating: 4.6,
    reviews: 540
  }
};

function resolveProductVisuals(product: Product & { category?: { name?: string } | string }): {
  imageUrl: string;
  badge: string;
  rating: number;
  reviewCount: number;
  originalPriceCents: number;
} {
  const inv = product.inventoryItems?.[0];
  const attrs = (inv?.attributes as Record<string, unknown> | null) ?? null;
  const price = inv?.priceCents ?? 0;

  // 1. Check if explicitly saved in inventory attributes
  if (attrs && typeof attrs.imageUrl === "string" && attrs.imageUrl.length > 5) {
    return {
      imageUrl: attrs.imageUrl,
      badge: typeof attrs.badge === "string" ? attrs.badge : "Prime Assured",
      rating: typeof attrs.rating === "number" ? attrs.rating : 4.8,
      reviewCount: typeof attrs.reviewCount === "number" ? attrs.reviewCount : 124,
      originalPriceCents: typeof attrs.originalPriceCents === "number" ? attrs.originalPriceCents : Math.round(price * 1.25)
    };
  }

  // 2. Check curated slug map
  const match = PRODUCT_IMAGE_FALLBACKS[product.slug];
  if (match) {
    return {
      imageUrl: match.image,
      badge: match.badge,
      rating: match.rating,
      reviewCount: match.reviews,
      originalPriceCents: Math.round(price * 1.25)
    };
  }

  // 3. Category fallback
  const rawCat = product.category as unknown;
  const catName =
    typeof rawCat === "string"
      ? rawCat
    : rawCat && typeof rawCat === "object" && "name" in rawCat && typeof (rawCat as { name?: unknown }).name === "string"
      ? ((rawCat as { name: string }).name)
      : "";
  const lowerCat = catName.toLowerCase();

  let fallbackImage = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";
  if (lowerCat.includes("elect") || lowerCat.includes("gadget")) {
    fallbackImage = "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80";
  } else if (lowerCat.includes("mobile") || lowerCat.includes("phone")) {
    fallbackImage = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80";
  } else if (lowerCat.includes("fash") || lowerCat.includes("apparel") || lowerCat.includes("cloth")) {
    fallbackImage = "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80";
  } else if (lowerCat.includes("food") || lowerCat.includes("grocer") || lowerCat.includes("meal")) {
    fallbackImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";
  }

  return {
    imageUrl: fallbackImage,
    badge: "Amazon's Choice",
    rating: 4.7,
    reviewCount: 350,
    originalPriceCents: Math.round(price * 1.25)
  };
}

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

  register(input: { email: string; password: string; firstName?: string; lastName?: string; role?: "CUSTOMER" | "ADMIN" }) {
    if (isDemoModeActive()) {
      return demoApi.register(input);
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
        prods.map((p) => {
          const category =
            p.category && typeof p.category === "object"
              ? (p.category as { name?: string }).name ?? undefined
              : (p.category as string | undefined);

          const visuals = resolveProductVisuals(p);

          return {
            ...p,
            category,
            imageUrl: p.imageUrl || visuals.imageUrl,
            badge: p.badge || visuals.badge,
            rating: p.rating || visuals.rating,
            reviewCount: p.reviewCount || visuals.reviewCount,
            originalPriceCents: p.originalPriceCents || visuals.originalPriceCents
          };
        })
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

  // Admin APIs
  adminUsers(accessToken: string) {
    if (isDemoModeActive()) {
      return demoApi.adminUsers();
    }

    return request<AdminUser[]>("/api/v1/users", {
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

  adminDeleteCategory(accessToken: string, categoryId: string) {
    if (isDemoModeActive()) {
      return demoApi.adminDeleteCategory(accessToken, categoryId);
    }

    return request<void>(`/api/v1/catalog/admin/categories/${categoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
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

  adminDeleteProduct(accessToken: string, productId: string) {
    if (isDemoModeActive()) {
      return demoApi.adminDeleteProduct(accessToken, productId);
    }

    return request<void>(`/api/v1/catalog/admin/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
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
      attributes?: Record<string, unknown>;
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

  adminUpdateInventory(
    accessToken: string,
    inventoryItemId: string,
    input: { stockCount?: number; priceCents?: number }
  ) {
    if (isDemoModeActive()) {
      return demoApi.adminUpdateInventory(accessToken, inventoryItemId, input);
    }

    return request<InventoryItem>(`/api/v1/catalog/admin/inventory/${inventoryItemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(input)
    });
  },

  async adminCreateFullProduct(
    accessToken: string,
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
    if (isDemoModeActive()) {
      return demoApi.adminCreateFullProduct(accessToken, input);
    }

    // 1. Create product in catalog
    const product = await this.adminCreateProduct(accessToken, {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      isActive: true
    });

    // 2. Create inventory SKU with image & badge attributes
    const inventory = await this.adminCreateInventory(accessToken, {
      productId: product.id,
      sku: input.sku,
      stockCount: input.stockCount,
      priceCents: input.priceCents,
      currency: "INR",
      attributes: {
        imageUrl: input.imageUrl,
        badge: input.badge
      }
    });

    return {
      ...product,
      imageUrl: input.imageUrl,
      badge: input.badge,
      inventoryItems: [inventory]
    };
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

export function formatMoney(amountCents: number, currency?: string) {
  const curr = !currency || currency === "USD" ? "INR" : currency;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: curr,
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}
