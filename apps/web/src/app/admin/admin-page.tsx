"use client";

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
  const [categoryName, setCategoryName] = useState("New Category");
  const [productName, setProductName] = useState("New Product");
  const [sku, setSku] = useState("NEW-SKU-001");
  const [stockCount, setStockCount] = useState(10);
  const [priceCents, setPriceCents] = useState(4999);
  const [message, setMessage] = useState("Sign in with an admin account.");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    try {
      const nextSession = await api.login(email, password);
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
      setMessage("Category created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create category.");
    } finally {
      setLoading(false);
    }
  }

  async function createProduct() {
    if (!session || !categories[0]) {
      setMessage("Create a category first.");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateProduct(session.tokens.accessToken, {
        categoryId: categories[0].id,
        name: productName,
        description: `${productName} description`,
        isActive: true
      });
      await refreshAdminData();
      setMessage("Product created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create product.");
    } finally {
      setLoading(false);
    }
  }

  async function createInventory() {
    if (!session || !products[0]) {
      setMessage("Create a product first.");
      return;
    }

    setLoading(true);
    try {
      await api.adminCreateInventory(session.tokens.accessToken, {
        productId: products[0].id,
        sku,
        stockCount,
        priceCents,
        currency: "USD"
      });
      await refreshAdminData();
      setMessage("Inventory item created.");
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
          <h1>Catalog operations</h1>
        </div>
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
      </header>

      <section className="status-line">{message}</section>

      <section className="admin-grid">
        <article className="admin-panel">
          <h2>Category</h2>
          <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          <button onClick={createCategory} disabled={loading || !session}>
            Create category
          </button>
        </article>

        <article className="admin-panel">
          <h2>Product</h2>
          <input value={productName} onChange={(event) => setProductName(event.target.value)} />
          <button onClick={createProduct} disabled={loading || !session}>
            Create product
          </button>
        </article>

        <article className="admin-panel">
          <h2>Inventory</h2>
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

      <section className="admin-table">
        <h2>Recent Orders</h2>
        {orders.map((order) => (
          <div className="order-row" key={order.id}>
            <span>{order.user.email}</span>
            <strong>{order.status}</strong>
            <span>{formatMoney(order.totalCents, order.currency)}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
