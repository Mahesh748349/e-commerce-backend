"use client";

import Link from "next/link";
import { useState } from "react";
import {
  api,
  formatMoney,
  type AdminOrder,
  type AuthSession,
  type Category,
  type Product
} from "../../lib/api";

export function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("AdminPassword123!");
  const [categoryName, setCategoryName] = useState("Accessories");
  const [productName, setProductName] = useState("Travel Backpack");
  const [sku, setSku] = useState("BAG-BLK-STD");
  const [stockCount, setStockCount] = useState(12);
  const [priceCents, setPriceCents] = useState(7999);
  const [message, setMessage] = useState("Sign in with the seeded admin account.");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    try {
      const nextSession = await api.login(email, password);
      if (nextSession.user.role !== "ADMIN") {
        setMessage("This page requires an ADMIN account.");
        return;
      }

      setSession(nextSession);
      setMessage(`Signed in as ${nextSession.user.email}.`);
      await refreshAdminData(nextSession.tokens.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshAdminData(accessToken = session?.tokens.accessToken) {
    if (!accessToken) {
      return;
    }

    const [nextCategories, nextProducts, nextOrders] = await Promise.all([
      api.adminCategories(accessToken),
      api.products(),
      api.adminOrders(accessToken)
    ]);

    setCategories(nextCategories);
    setProducts(nextProducts);
    setOrders(nextOrders);
  }

  async function createCategory() {
    if (!session) {
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateCategory(session.tokens.accessToken, {
        name: categoryName,
        description: `${categoryName} catalog group`
      });
      await refreshAdminData();
      setMessage("Category created in PostgreSQL.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create category.");
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    if (!session) {
      return;
    }

    const categoryId = categories[0]?.id;
    if (!categoryId) {
      setMessage("Create or load a category before creating products.");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateProduct(session.tokens.accessToken, {
        categoryId,
        name: productName,
        description: `${productName} created from the admin console`,
        isActive: true
      });
      await refreshAdminData();
      setMessage("Product created in PostgreSQL.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create product.");
    } finally {
      setLoading(false);
    }
  }

  async function createInventory() {
    if (!session) {
      return;
    }

    const productId = products[0]?.id;
    if (!productId) {
      setMessage("Create or load a product before creating inventory.");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateInventory(session.tokens.accessToken, {
        productId,
        sku,
        stockCount,
        priceCents,
        currency: "USD"
      });
      await refreshAdminData();
      setMessage("Inventory SKU created in PostgreSQL.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create inventory.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shop-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Commerce Admin</p>
          <h1>Catalog and order operations</h1>
        </div>
        <nav className="nav-actions">
          <Link href="/">Storefront</Link>
          <button className="secondary-button" onClick={() => refreshAdminData()} disabled={!session || loading}>
            Refresh
          </button>
        </nav>
      </header>

      <section className="auth-strip">
        <div className="auth-panel">
          <input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Admin email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            aria-label="Admin password"
          />
          <button onClick={login} disabled={loading}>
            Sign in
          </button>
        </div>
        <div className="session-badge">
          {session ? `${session.user.email} / ${session.user.role}` : "Not signed in"}
        </div>
      </section>

      <section className="status-line">{message}</section>

      <section className="admin-grid">
        <article className="admin-panel">
          <h2>Create Category</h2>
          <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          <button onClick={createCategory} disabled={loading || !session}>
            Create category
          </button>
        </article>

        <article className="admin-panel">
          <h2>Create Product</h2>
          <input value={productName} onChange={(event) => setProductName(event.target.value)} />
          <button onClick={createProduct} disabled={loading || !session}>
            Create product
          </button>
        </article>

        <article className="admin-panel">
          <h2>Create Inventory</h2>
          <input value={sku} onChange={(event) => setSku(event.target.value)} />
          <input
            value={stockCount}
            min={0}
            type="number"
            onChange={(event) => setStockCount(Number(event.target.value))}
          />
          <input
            value={priceCents}
            min={1}
            type="number"
            onChange={(event) => setPriceCents(Number(event.target.value))}
          />
          <button onClick={createInventory} disabled={loading || !session}>
            Create inventory
          </button>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="admin-table">
          <h2>Categories</h2>
          {!categories.length ? <p>No categories loaded.</p> : null}
          {categories.map((category) => (
            <div className="data-row" key={category.id}>
              <strong>{category.name}</strong>
              <span>{category.slug}</span>
            </div>
          ))}
        </article>

        <article className="admin-table">
          <h2>Products and SKUs</h2>
          {!products.length ? <p>No products loaded.</p> : null}
          {products.map((product) => (
            <div className="data-row" key={product.id}>
              <strong>{product.name}</strong>
              <span>{product.inventoryItems.length} SKU(s)</span>
              <span>
                {product.inventoryItems[0]
                  ? formatMoney(product.inventoryItems[0].priceCents, product.inventoryItems[0].currency)
                  : "No inventory"}
              </span>
            </div>
          ))}
        </article>
      </section>

      <section className="admin-table">
        <h2>Recent Orders</h2>
        {!orders.length ? <p>No orders yet. Checkout from the storefront to create one.</p> : null}
        {orders.map((order) => (
          <div className="order-row" key={order.id}>
            <span>{order.user.email}</span>
            <strong>{order.status}</strong>
            <span>{order.items.length} lines</span>
            <span>{formatMoney(order.totalCents, order.currency)}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
