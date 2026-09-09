"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  formatMoney,
  type AuthSession,
  type Cart,
  type CustomerOrder,
  type Product
} from "../lib/api";

const productImages = [
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
];

export function ShopPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("CustomerPassword123!");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading live catalog from the API.");
  const [loading, setLoading] = useState(false);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.description ?? ""}`.toLowerCase().includes(query.toLowerCase())
      ),
    [products, query]
  );

  const cartTotal = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0) ?? 0,
    [cart]
  );

  useEffect(() => {
    const storedSession = window.localStorage.getItem("session");

    if (storedSession) {
      const parsedSession = JSON.parse(storedSession) as AuthSession;
      setSession(parsedSession);
      void refreshCustomerData(parsedSession.tokens.accessToken);
    }

    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setProducts(await api.products());
      setMessage("Catalog loaded from the real backend.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load products.");
    }
  }

  async function refreshCustomerData(accessToken = session?.tokens.accessToken) {
    if (!accessToken) {
      return;
    }

    const [nextCart, nextOrders] = await Promise.all([api.cart(accessToken), api.myOrders(accessToken)]);
    setCart(nextCart);
    setOrders(nextOrders);
  }

  async function login() {
    setLoading(true);
    try {
      const nextSession = await api.login(email, password);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      await refreshCustomerData(nextSession.tokens.accessToken);
      setMessage(`Signed in as ${nextSession.user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    setLoading(true);
    try {
      const nextSession = await api.register({
        email,
        password,
        firstName: "Resume",
        lastName: "Demo"
      });
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      await refreshCustomerData(nextSession.tokens.accessToken);
      setMessage(`Registered and signed in as ${nextSession.user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setSession(null);
    setCart(null);
    setOrders([]);
    window.localStorage.removeItem("session");
    setMessage("Signed out.");
  }

  async function addToCart(product: Product) {
    const inventoryItem = product.inventoryItems[0];

    if (!session) {
      setMessage("Sign in before adding items.");
      return;
    }

    if (!inventoryItem) {
      setMessage("This product has no sellable inventory.");
      return;
    }

    setLoading(true);
    try {
      setCart(await api.addCartItem(session.tokens.accessToken, inventoryItem.id, 1));
      setMessage(`${product.name} added to cart.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add item.");
    } finally {
      setLoading(false);
    }
  }

  async function updateCartItem(cartItemId: string, quantity: number) {
    if (!session) {
      return;
    }

    setCart(await api.updateCartItem(session.tokens.accessToken, cartItemId, quantity));
  }

  async function checkout() {
    if (!session || !cart?.items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const order = await api.checkout(session.tokens.accessToken);
      const intent = await api.createPaymentIntent(session.tokens.accessToken, order.id);
      setMessage(`Order created. Local payment intent ${intent.providerOrderId} is ready.`);
      await refreshCustomerData(session.tokens.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!session) {
      return;
    }

    setLoading(true);
    try {
      await api.cancelOrder(session.tokens.accessToken, orderId);
      await refreshCustomerData(session.tokens.accessToken);
      setMessage("Pending order cancelled and inventory restored.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shop-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Commerce Storefront</p>
          <h1>Customer shopping flow</h1>
        </div>
        <nav className="nav-actions">
          <Link href="/admin">Admin console</Link>
          {session ? <button onClick={logout}>Sign out</button> : null}
        </nav>
      </header>

      <section className="auth-strip">
        <div className="auth-panel">
          <input value={email} onChange={(event) => setEmail(event.target.value)} aria-label="Email" />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            aria-label="Password"
          />
          <button onClick={login} disabled={loading}>
            Sign in
          </button>
          <button className="secondary-button" onClick={register} disabled={loading}>
            Register
          </button>
        </div>
        <div className="session-badge">
          {session ? `${session.user.email} / ${session.user.role}` : "Not signed in"}
        </div>
      </section>

      <section className="status-line">{message}</section>

      <div className="commerce-layout">
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Products from PostgreSQL</h2>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </div>

          <div className="product-grid">
            {filteredProducts.map((product, index) => {
              const inventoryItem = product.inventoryItems[0];
              return (
                <article className="product-card" key={product.id}>
                  <img src={productImages[index % productImages.length]} alt="" />
                  <div className="product-content">
                    <h2>{product.name}</h2>
                    <p>{product.description ?? "No description yet."}</p>
                    <div className="product-meta">
                      <span>
                        {inventoryItem
                          ? formatMoney(inventoryItem.priceCents, inventoryItem.currency)
                          : "Unavailable"}
                      </span>
                      <span>{inventoryItem?.stockCount ?? 0} in stock</span>
                    </div>
                    <button onClick={() => addToCart(product)} disabled={loading || !inventoryItem}>
                      Add to cart
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="cart-panel">
          <h2>Cart</h2>
          {!cart?.items.length ? <p>Your cart is empty.</p> : null}
          {cart?.items.map((item) => (
            <div className="cart-line" key={item.id}>
              <div>
                <strong>{item.product.name}</strong>
                <span>{formatMoney(item.unitPriceCents, item.inventoryItem.currency)}</span>
              </div>
              <input
                value={item.quantity}
                min={0}
                max={100}
                type="number"
                onChange={(event) => updateCartItem(item.id, Number(event.target.value))}
                aria-label={`Quantity for ${item.product.name}`}
              />
            </div>
          ))}
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatMoney(cartTotal, cart?.items[0]?.inventoryItem.currency ?? "USD")}</strong>
          </div>
          <button className="checkout-button" onClick={checkout} disabled={loading || !cart?.items.length}>
            Checkout
          </button>
        </aside>
      </div>

      <section className="order-history">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Order history</h2>
          </div>
          <button className="secondary-button" onClick={() => refreshCustomerData()} disabled={!session || loading}>
            Refresh
          </button>
        </div>
        {!orders.length ? <p>No orders yet. Checkout a cart to create one.</p> : null}
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div>
              <strong>{order.id.slice(0, 8)}</strong>
              <span>{order.status}</span>
            </div>
            <div>
              <span>{order.items.length} item lines</span>
              <strong>{formatMoney(order.totalCents, order.currency)}</strong>
            </div>
            <button
              className="secondary-button"
              onClick={() => cancelOrder(order.id)}
              disabled={loading || order.status !== "PENDING"}
            >
              Cancel
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
