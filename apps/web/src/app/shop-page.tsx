"use client";

import { useEffect, useMemo, useState } from "react";
import { api, formatMoney, type AuthSession, type Cart, type Product } from "../lib/api";

const productImages = [
  "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
];

export function ShopPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("CustomerPassword123!");
  const [message, setMessage] = useState("Connect the API to load live products.");
  const [loading, setLoading] = useState(false);

  const cartTotal = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0) ?? 0,
    [cart]
  );

  useEffect(() => {
    const storedSession = window.localStorage.getItem("session");

    if (storedSession) {
      const parsedSession = JSON.parse(storedSession) as AuthSession;
      setSession(parsedSession);
      void loadCart(parsedSession.tokens.accessToken);
    }

    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setProducts(await api.products());
      setMessage("Products loaded from API.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load products.");
    }
  }

  async function loadCart(accessToken: string) {
    try {
      setCart(await api.cart(accessToken));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load cart.");
    }
  }

  async function login() {
    setLoading(true);
    try {
      const nextSession = await api.login(email, password);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      await loadCart(nextSession.tokens.accessToken);
      setMessage(`Signed in as ${nextSession.user.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
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
      setMessage(`Order ${order.id} created. Payment intent ${intent.providerOrderId} is ready.`);
      await loadCart(session.tokens.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shop-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Commerce Storefront</p>
          <h1>Shop catalog</h1>
        </div>
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
        </div>
      </header>

      <section className="status-line">{message}</section>

      <div className="commerce-layout">
        <section className="product-grid">
          {products.map((product, index) => {
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
    </main>
  );
}
