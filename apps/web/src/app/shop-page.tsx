"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  formatMoney,
  isDemoModeActive,
  setDemoModeActive,
  type AuthSession,
  type Cart,
  type Category,
  type CustomerOrder,
  type Product
} from "../lib/api";

const COUPON_CODES: Record<string, number> = {
  NAMMAKARNATAKA: 0.25,
  BENGALURU50: 0.25,
  KAVERI20: 0.2,
  MYSURU15: 0.15,
  FLIPKART50: 0.25,
  AMAZON20: 0.2,
  SAVE20: 0.2,
  WELCOME10: 0.1
};

export function ShopPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);

  // Search & Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeQuery, setActiveQuery] = useState<string>("");

  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [registerRole, setRegisterRole] = useState<"CUSTOMER" | "ADMIN">("CUSTOMER");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOrdersView, setShowOrdersView] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Form states
  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("CustomerPassword123!");
  const [firstName, setFirstName] = useState("Rahul");
  const [lastName, setLastName] = useState("Gowda");
  const [couponInput, setCouponInput] = useState("NAMMAKARNATAKA");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountRate: number } | null>({
    code: "NAMMAKARNATAKA",
    discountRate: 0.25
  });
  const [deliveryPincode, setDeliveryPincode] = useState("Indiranagar, Bengaluru - 560038");

  // Checkout address & payment
  const [shippingName, setShippingName] = useState("Rahul Gowda");
  const [shippingAddress, setShippingAddress] = useState("#14, 100 Feet Road, HAL 2nd Stage, Indiranagar");
  const [shippingCity, setShippingCity] = useState("Bengaluru, Karnataka - 560038");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cod">("upi");

  const [message, setMessage] = useState("Connecting to live e-commerce catalog...");
  const [loading, setLoading] = useState(false);

  // Sync demo mode state on client
  useEffect(() => {
    setIsDemo(isDemoModeActive());
  }, []);

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (product.category && product.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
        (product.slug && product.slug.toLowerCase().includes(selectedCategory.toLowerCase()));

      const targetText = `${product.name} ${product.description ?? ""} ${product.category ?? ""}`.toLowerCase();
      const matchesSearch = !activeQuery || targetText.includes(activeQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => (a.inventoryItems[0]?.priceCents ?? 0) - (b.inventoryItems[0]?.priceCents ?? 0));
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => (b.inventoryItems[0]?.priceCents ?? 0) - (a.inventoryItems[0]?.priceCents ?? 0));
    }
    if (sortBy === "rating") {
      return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return list;
  }, [products, selectedCategory, activeQuery, sortBy]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart?.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0) ?? 0;
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (!cart?.items.length) return 0;
    return cartSubtotal >= 49900 ? 0 : 4000; // Free delivery over ₹499 (₹40 standard delivery fee)
  }, [cart, cartSubtotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round(cartSubtotal * appliedCoupon.discountRate);
  }, [appliedCoupon, cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + deliveryFee - discountAmount);
  }, [cartSubtotal, deliveryFee, discountAmount]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage.getItem("use_demo_mode") === null) {
      setDemoModeActive(false);
      setIsDemo(false);
    } else {
      setIsDemo(isDemoModeActive());
    }

    const storedSession = window.localStorage.getItem("session");
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession) as AuthSession;
        setSession(parsedSession);
        void refreshCustomerData(parsedSession.tokens.accessToken);
      } catch {
        window.localStorage.removeItem("session");
      }
    }

    void loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      const [prods, cats] = await Promise.all([
        api.products(),
        api.categories().catch(() => [])
      ]);
      setProducts(prods);
      if (cats.length) setCategories(cats);
      setMessage(isDemoModeActive() ? "⚡ Running in Offline Demo Mode with rich catalog." : "🟢 Connected to Express Backend & PostgreSQL.");
    } catch (error) {
      // Graceful fallback to demo mode if backend is unreachable
      setDemoModeActive(true);
      setIsDemo(true);
      const [prods, cats] = await Promise.all([api.products(), api.categories()]);
      setProducts(prods);
      setCategories(cats);
      setMessage("⚡ Express backend offline. Seamlessly switched to Demo Mode.");
    }
  }

  async function refreshCustomerData(accessToken = session?.tokens.accessToken) {
    if (!accessToken) return;

    try {
      const [nextCart, nextOrders] = await Promise.all([
        api.cart(accessToken),
        api.myOrders(accessToken)
      ]);
      setCart(nextCart);
      setOrders(nextOrders);
    } catch {
      // In demo mode or if token expired
      if (!isDemoModeActive()) {
        window.localStorage.removeItem("session");
        setSession(null);
        setCart(null);
        setOrders([]);
      }
    }
  }

  function toggleDemoMode() {
    const nextMode = !isDemo;
    setDemoModeActive(nextMode);
    setIsDemo(nextMode);
    void loadCatalog();
    setMessage(nextMode ? "Switched to In-Memory Demo Mode." : "Switched to Live Express Backend (Port 4000).");
  }

  async function handleLogin() {
    setLoading(true);
    try {
      const nextSession = await api.login(email, password);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setMessage(`Signed in as ${nextSession.user.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setLoading(true);
    try {
      const nextSession = await api.register({
        email,
        password,
        firstName,
        lastName,
        role: registerRole
      });
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setMessage(
        registerRole === "ADMIN"
          ? `🎉 Registered as Admin (${nextSession.user.email})! You can manage the catalog in Seller Central.`
          : `🎉 Registered and signed in as ${nextSession.user.email}!`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setCart(null);
    setOrders([]);
    window.localStorage.removeItem("session");
    setMessage("Signed out successfully.");
  }

  async function handleAddToCart(product: Product, openDrawer = false) {
    const inventoryItem = product.inventoryItems[0];
    if (!inventoryItem) {
      setMessage("This item is currently unavailable.");
      return;
    }

    if (!session) {
      setIsAuthOpen(true);
      setMessage("Please sign in or use demo account to add items to your cart.");
      return;
    }

    setLoading(true);
    try {
      const nextCart = await api.addCartItem(session.tokens.accessToken, inventoryItem.id, 1);
      setCart(nextCart);
      setMessage(`Added "${product.name}" to cart.`);
      if (openDrawer) {
        setIsCartOpen(true);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add item.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyNow(product: Product) {
    await handleAddToCart(product, false);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  async function handleUpdateQuantity(cartItemId: string, nextQty: number) {
    if (!session) return;
    try {
      const nextCart = await api.updateCartItem(session.tokens.accessToken, cartItemId, nextQty);
      setCart(nextCart);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update quantity.");
    }
  }

  function applyCoupon() {
    const cleanCode = couponInput.trim().toUpperCase();
    if (COUPON_CODES[cleanCode]) {
      setAppliedCoupon({ code: cleanCode, discountRate: COUPON_CODES[cleanCode] });
      setMessage(`Coupon ${cleanCode} applied! ${(COUPON_CODES[cleanCode] * 100).toFixed(0)}% discount.`);
      setCouponInput("");
    } else {
      setMessage("Invalid coupon. Try 'AMAZON20' or 'FLIPKART50' for discounts.");
    }
  }

  async function handleCheckout() {
    if (!session || !cart?.items.length) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const order = await api.checkout(session.tokens.accessToken);
      await api.createPaymentIntent(session.tokens.accessToken, order.id);

      setMessage(`🎉 Order placed successfully! Order ID: ${order.id.slice(0, 8)}. Event dispatched to RabbitMQ.`);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setAppliedCoupon(null);
      await refreshCustomerData(session.tokens.accessToken);
      setShowOrdersView(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed. Verify inventory stock.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOrder(orderId: string) {
    if (!session) return;
    setLoading(true);
    try {
      await api.cancelOrder(session.tokens.accessToken, orderId);
      await refreshCustomerData(session.tokens.accessToken);
      setMessage(`Order ${orderId.slice(0, 8)} cancelled. Inventory stock automatically restored.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel order.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setActiveQuery(searchQuery);
    if (searchCategory !== "all") {
      setSelectedCategory(searchCategory);
    }
    setShowOrdersView(false);
  }

  return (
    <div className="amz-shell">
      {/* 1. TOP BAR (AMAZON / FLIPKART STYLE) */}
      <header className="amz-header">
        <div className="amz-topbar">
          {/* Brand Logo */}
          <div
            className="amz-brand"
            onClick={() => {
              setSelectedCategory("all");
              setActiveQuery("");
              setSearchQuery("");
              setShowOrdersView(false);
            }}
          >
            <div className="amz-brand-logo">
              Shop<span className="accent">Swift</span>
              <span className="suffix">E-Commerce</span>
            </div>
          </div>

          {/* Location / Pincode */}
          <div
            className="amz-location-picker"
            onClick={() => {
              const newPin = prompt(
                "Enter delivery location or pin code (e.g. Indiranagar, Bengaluru - 560038 / Koramangala 560034 / Mysuru 570001 / Mangaluru 575001 / Hubballi 580020):",
                deliveryPincode
              );
              if (newPin) setDeliveryPincode(newPin);
            }}
            title="Click to change delivery location"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <div>
              <div className="loc-sub">Deliver to</div>
              <div className="loc-title">{deliveryPincode}</div>
            </div>
          </div>

          {/* Amazon / Flipkart Big Search Bar */}
          <form className="amz-search-container" onSubmit={handleSearchSubmit}>
            <select
              className="amz-search-select"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              aria-label="Select category"
            >
              <option value="all">All Departments</option>
              <option value="electronics">Electronics & Gadgets</option>
              <option value="mobiles">Mobiles & Tablets</option>
              <option value="fashion">Karnataka Handlooms & Fashion</option>
              <option value="food-delivery">Namma Food & Groceries (15m)</option>
            </select>
            <input
              className="amz-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Amazon & Flipkart deals, Mysore silk sarees, Coorg coffee, Masala dosa, iPhone 16..."
              aria-label="Search products"
            />
            <button type="submit" className="amz-search-btn" aria-label="Search button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Navigation Actions */}
          <div className="amz-nav-actions">
            {/* Mode Toggle (Live API vs Demo Mode) */}
            <div
              className={`amz-mode-toggle ${isDemo ? "demo" : "live"}`}
              onClick={toggleDemoMode}
              title="Click to toggle between Express Backend and In-Memory Demo"
            >
              <span>{isDemo ? "🟠 Demo Mode" : "🟢 Live API"}</span>
            </div>

            {/* Seller Central / Admin Link */}
            <Link
              href="/admin"
              className="amz-nav-item"
              style={{ textDecoration: "none", color: "#ffa41c" }}
              title="Access Admin Console & Seller Central"
            >
              <span className="nav-line1" style={{ color: "#ffa41c" }}>Admin Portal</span>
              <span className="nav-line2" style={{ color: "#ffffff", display: "flex", alignItems: "center", gap: "4px" }}>
                🛡️ Seller Central
              </span>
            </Link>

            {/* Account & Lists */}
            {session ? (
              <div className="amz-nav-item" onClick={handleLogout} title="Click to Sign Out">
                <span className="nav-line1">Hello, {session.user.firstName || "Customer"}</span>
                <span className="nav-line2">Sign Out</span>
              </div>
            ) : (
              <div className="amz-nav-item" onClick={() => setIsAuthOpen(true)}>
                <span className="nav-line1">Hello, Sign in</span>
                <span className="nav-line2">Account & Lists</span>
              </div>
            )}

            {/* Orders Tab */}
            <div
              className="amz-nav-item"
              onClick={() => setShowOrdersView(!showOrdersView)}
              title="View customer order history"
            >
              <span className="nav-line1">Returns</span>
              <span className="nav-line2">& Orders ({orders.length})</span>
            </div>

            {/* Cart Button */}
            <button className="amz-cart-btn" onClick={() => setIsCartOpen(true)} aria-label="View Shopping Cart">
              <div className="amz-cart-icon-wrapper">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <div className="amz-cart-badge">{cartItemCount}</div>
              </div>
              <span className="nav-line2">Cart</span>
            </button>
          </div>
        </div>

        {/* Sub-Navbar (Department Strip) */}
        <nav className="amz-subnav">
          <button
            className={`amz-subnav-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory("all");
              setShowOrdersView(false);
            }}
          >
            ☰ All Products
          </button>
          <button
            className={`amz-subnav-pill ${selectedCategory === "electronics" ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory("electronics");
              setShowOrdersView(false);
            }}
          >
            Electronics & Gadgets
          </button>
          <button
            className={`amz-subnav-pill ${selectedCategory === "mobiles" ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory("mobiles");
              setShowOrdersView(false);
            }}
          >
            Mobiles & Tablets
          </button>
          <button
            className={`amz-subnav-pill ${selectedCategory === "fashion" ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory("fashion");
              setShowOrdersView(false);
            }}
          >
            🥻 Karnataka Handlooms & Fashion
          </button>
          <button
            className={`amz-subnav-pill ${selectedCategory === "food-delivery" ? "active" : ""}`}
            onClick={() => {
              setSelectedCategory("food-delivery");
              setShowOrdersView(false);
            }}
          >
            ☕ Namma Food & Groceries (15m Delivery)
          </button>
          <Link href="/admin" className="amz-subnav-pill" style={{ marginLeft: "auto", textDecoration: "none" }}>
            ⚙️ Admin Console
          </Link>
        </nav>
      </header>

      {/* 2. HERO PROMOTIONAL BANNER (NAMMA KARNATAKA FESTIVAL) */}
      {!showOrdersView && (
        <section className="amz-hero-banner">
          <div className="amz-hero-content">
            <div>
              <div className="amz-hero-tag">🔥 Namma Karnataka Mega Utsav • Up to 70% Off Across Bengaluru & Mysuru</div>
              <h1 className="amz-hero-title">Instant 15-Min Delivery & Karnataka Specialties</h1>
              <p className="amz-hero-subtitle">
                Pure Mysore Silk Sarees, Coorg Single-Estate Coffee, Bengaluru Masala Dosa, and Top Tech Gadgets.
                Powered by Node.js, PostgreSQL, Redis locks, and RabbitMQ.
              </p>
              <div className="amz-hero-highlights">
                <div className="amz-highlight-card">
                  <strong>⚡ 15 Mins</strong>
                  <span>Instant Blinkit/Swiggy Speed across Bengaluru & Mysuru</span>
                </div>
                <div className="amz-highlight-card">
                  <strong>🏷️ NAMMAKARNATAKA</strong>
                  <span>Use Coupon for 25% Off Cart</span>
                </div>
                <div className="amz-highlight-card">
                  <strong>🛡️ Prime Assured</strong>
                  <span>GI Tagged Handlooms & Brand Warranty</span>
                </div>
              </div>
            </div>

            {/* Quick Hero Deal Tiles */}
            <div className="amz-hero-deals-grid">
              {products.slice(0, 4).map((item) => (
                <div key={item.id} className="amz-hero-deal-tile" onClick={() => setSelectedProduct(item)}>
                  <img src={item.imageUrl ?? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"} alt="" />
                  <div>
                    <span className="badge">{item.badge ?? "Special Deal"}</span>
                    <h4>{item.name.slice(0, 30)}...</h4>
                    <strong style={{ fontSize: "14px", color: "#b12704" }}>
                      {formatMoney(item.inventoryItems[0]?.priceCents ?? 0, "INR")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. MAIN STOREFRONT CONTENT */}
      <main className="amz-main-container">
        {/* Status Strip */}
        <section className="amz-status-strip">
          <div>
            <strong>Status: </strong>
            <span>{message}</span>
          </div>
          <div className="amz-status-actions">
            {!session && (
              <button
                className="amz-pill-btn"
                style={{ background: "#232f3e", color: "#ffffff" }}
                onClick={() => setIsAuthOpen(true)}
              >
                1-Click Demo Login
              </button>
            )}
            <button className="amz-pill-btn" onClick={() => loadCatalog()} disabled={loading}>
              Refresh Catalog
            </button>
          </div>
        </section>

        {/* ORDER HISTORY VIEW */}
        {showOrdersView ? (
          <section className="amz-orders-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "24px" }}>Your Orders & Live Tracking</h2>
                <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                  Real-time order state machine decoupled via RabbitMQ & BullMQ event workers
                </p>
              </div>
              <button className="amz-pill-btn active" onClick={() => setShowOrdersView(false)}>
                ← Back to Catalog
              </button>
            </div>

            {!orders.length ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>You haven't placed any orders yet.</p>
                <button className="amz-btn-cart" onClick={() => setShowOrdersView(false)}>
                  Start Shopping
                </button>
              </div>
            ) : null}

            {orders.map((order) => {
              const stepIndex =
                order.status === "PENDING"
                  ? 1
                  : order.status === "PAID"
                    ? 2
                    : order.status === "SHIPPED"
                      ? 3
                      : 4;

              return (
                <article className="amz-order-card" key={order.id}>
                  <div className="amz-order-header">
                    <div className="col">
                      <span className="label">Order Placed</span>
                      <span className="val">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="col">
                      <span className="label">Total Amount</span>
                      <span className="val">{formatMoney(order.totalCents, order.currency)}</span>
                    </div>
                    <div className="col">
                      <span className="label">Ship To</span>
                      <span className="val">{shippingName}</span>
                    </div>
                    <div className="col" style={{ marginLeft: "auto" }}>
                      <span className="label">Order # {order.id.slice(0, 8)}</span>
                      <span
                        className="val"
                        style={{
                          color: order.status === "CANCELLED" ? "#b12704" : "#007600",
                          fontWeight: 800
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="amz-order-body">
                    {/* Live Order Timeline Stepper */}
                    {order.status !== "CANCELLED" && (
                      <div className="amz-timeline">
                        <div className="amz-timeline-track">
                          <div
                            className="amz-timeline-progress"
                            style={{ width: `${((stepIndex - 1) / 3) * 100}%` }}
                          />
                        </div>

                        <div className="amz-timeline-step">
                          <div className={`amz-step-dot ${stepIndex >= 1 ? "active" : ""}`}>✓</div>
                          <span className={`amz-step-label ${stepIndex >= 1 ? "active" : ""}`}>Order Placed</span>
                        </div>

                        <div className="amz-timeline-step">
                          <div className={`amz-step-dot ${stepIndex >= 2 ? "active" : stepIndex === 1 ? "current" : ""}`}>
                            {stepIndex >= 2 ? "✓" : "2"}
                          </div>
                          <span className={`amz-step-label ${stepIndex >= 2 ? "active" : ""}`}>Processing</span>
                        </div>

                        <div className="amz-timeline-step">
                          <div className={`amz-step-dot ${stepIndex >= 3 ? "active" : stepIndex === 2 ? "current" : ""}`}>
                            {stepIndex >= 3 ? "✓" : "3"}
                          </div>
                          <span className={`amz-step-label ${stepIndex >= 3 ? "active" : ""}`}>Dispatched</span>
                        </div>

                        <div className="amz-timeline-step">
                          <div className={`amz-step-dot ${stepIndex >= 4 ? "active" : stepIndex === 3 ? "current" : ""}`}>
                            {stepIndex >= 4 ? "✓" : "4"}
                          </div>
                          <span className={`amz-step-label ${stepIndex >= 4 ? "active" : ""}`}>Delivered</span>
                        </div>
                      </div>
                    )}

                    {/* Order Item List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0" }}>
                      {order.items.map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "14px"
                          }}
                        >
                          <div>
                            <strong>{it.name}</strong> × {it.quantity} (SKU: {it.sku})
                          </div>
                          <strong>{formatMoney(it.lineTotalCents, order.currency)}</strong>
                        </div>
                      ))}
                    </div>

                    {order.status === "PENDING" && (
                      <button
                        className="amz-pill-btn"
                        style={{ color: "#b12704", borderColor: "#b12704" }}
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={loading}
                      >
                        Cancel Order & Restore Inventory
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          /* PRODUCT CATALOG GRID */
          <>
            <div className="amz-toolbar">
              <h2 className="amz-toolbar-title">
                Results
                <span>
                  ({filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} available)
                </span>
              </h2>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <select
                  className="amz-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort products by"
                >
                  <option value="featured">✨ Featured Deals</option>
                  <option value="price-asc">💵 Price: Low to High</option>
                  <option value="price-desc">💎 Price: High to Low</option>
                  <option value="rating">⭐ Avg. Customer Review</option>
                </select>

                <div className="amz-category-pills">
                <button
                  className={`amz-pill-btn ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  All
                </button>
                <button
                  className={`amz-pill-btn ${selectedCategory === "electronics" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("electronics")}
                >
                  Electronics
                </button>
                <button
                  className={`amz-pill-btn ${selectedCategory === "mobiles" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("mobiles")}
                >
                  Mobiles
                </button>
                <button
                  className={`amz-pill-btn ${selectedCategory === "fashion" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("fashion")}
                >
                  Fashion
                </button>
                <button
                  className={`amz-pill-btn ${selectedCategory === "food-delivery" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("food-delivery")}
                >
                  Food & Dining
                </button>
              </div>
            </div>
          </div>

            <div className="amz-products-grid">
              {filteredProducts.map((product) => {
                const inventoryItem = product.inventoryItems[0];
                const priceCents = inventoryItem?.priceCents ?? 0;
                const origPriceCents = product.originalPriceCents ?? Math.round(priceCents * 1.25);
                const discountPercent = Math.max(
                  10,
                  Math.round(((origPriceCents - priceCents) / origPriceCents) * 100)
                );
                const stock = inventoryItem?.stockCount ?? 0;

                return (
                  <article className="amz-card" key={product.id}>
                    <div className="amz-card-image-wrap" onClick={() => setSelectedProduct(product)}>
                      <img
                        src={
                          product.imageUrl ??
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                        }
                        alt={product.name}
                        loading="lazy"
                      />
                      <div className="amz-badge-floating">{product.badge ?? "Best Value"}</div>
                      <div className="amz-badge-prime">Prime Assured</div>
                    </div>

                    <div className="amz-card-body">
                      <div className="amz-card-category">{typeof product.category === "string" ? product.category : "General"}</div>
                      <h3 className="amz-card-title" onClick={() => setSelectedProduct(product)}>
                        {product.name}
                      </h3>

                      {/* Ratings */}
                      <div className="amz-card-rating">
                        <span className="amz-stars">★★★★★</span>
                        <span className="amz-rating-score">{product.rating ?? 4.8}</span>
                        <span className="amz-review-count">({product.reviewCount ?? 840})</span>
                      </div>

                      {/* Pricing */}
                      <div className="amz-card-price-row">
                        <span className="amz-price-main">
                          {formatMoney(priceCents, inventoryItem?.currency ?? "INR")}
                        </span>
                        <span className="amz-price-original">
                          {formatMoney(origPriceCents, inventoryItem?.currency ?? "INR")}
                        </span>
                        <span className="amz-price-discount">{discountPercent}% OFF</span>
                      </div>

                      {/* Stock urgency */}
                      <div className={`amz-card-stock ${stock <= 15 ? "low-stock" : "in-stock"}`}>
                        {stock > 0
                          ? stock <= 15
                            ? `Only ${stock} left in stock - order soon`
                            : "In Stock • Eligible for FREE Delivery"
                          : "Temporarily Out of Stock"}
                      </div>

                      {/* Action buttons */}
                      <div className="amz-card-actions">
                        <button
                          className="amz-btn-cart"
                          onClick={() => handleAddToCart(product, true)}
                          disabled={loading || stock <= 0}
                        >
                          Add to Cart
                        </button>
                        <button
                          className="amz-btn-buy"
                          onClick={() => handleBuyNow(product)}
                          disabled={loading || stock <= 0}
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* 4. SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="amz-drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <aside className="amz-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="amz-drawer-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Shopping Cart ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
              </h3>
              <button className="amz-close-btn" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div className="amz-drawer-body">
              {!cart?.items.length ? (
                <div className="amz-empty-cart">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="1.5">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <h4>Your Amazon / Flipkart Cart is empty</h4>
                  <p>Explore daily festival discounts and add items to your cart.</p>
                </div>
              ) : null}

              {cart?.items.map((item) => (
                <div className="amz-cart-item" key={item.id}>
                  <img
                    src={
                      item.product.imageUrl ??
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
                    }
                    alt={item.product.name}
                  />
                  <div className="amz-cart-item-details">
                    <h4 className="amz-cart-item-title">{item.product.name}</h4>
                    <div className="amz-cart-item-price">
                      {formatMoney(item.unitPriceCents, item.inventoryItem.currency)}
                    </div>
                    <div className="amz-cart-qty-row">
                      <div className="amz-qty-stepper">
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="amz-item-remove" onClick={() => handleUpdateQuantity(item.id, 0)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            {cart?.items.length ? (
              <div className="amz-drawer-footer">
                {/* Coupon Box */}
                <div className="amz-coupon-box">
                  <input
                    className="amz-coupon-input"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon (e.g. FLIPKART50)"
                  />
                  <button className="amz-coupon-btn" onClick={applyCoupon}>
                    Apply
                  </button>
                </div>

                {/* Price Breakdown */}
                <div className="amz-bill-summary">
                  <div className="amz-bill-row">
                    <span>Subtotal</span>
                    <span>{formatMoney(cartSubtotal, "INR")}</span>
                  </div>
                  <div className="amz-bill-row">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? "FREE" : formatMoney(deliveryFee, "INR")}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="amz-bill-row discount">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{formatMoney(discountAmount, "INR")}</span>
                    </div>
                  )}
                  <div className="amz-bill-row total">
                    <span>Total Amount</span>
                    <span>{formatMoney(cartTotal, "INR")}</span>
                  </div>
                </div>

                <button
                  className="amz-btn-checkout"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  disabled={loading || !cart?.items.length}
                >
                  Proceed to Checkout ({formatMoney(cartTotal, "INR")})
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {/* 5. CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="amz-modal-backdrop" onClick={() => setIsCheckoutOpen(false)}>
          <div className="amz-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="amz-modal-header">
              <h3>Secure Checkout</h3>
              <button className="amz-close-btn" style={{ color: "#111" }} onClick={() => setIsCheckoutOpen(false)}>
                ✕
              </button>
            </div>

            <div className="amz-modal-body">
              {/* Shipping Details */}
              <div>
                <h4 style={{ margin: "0 0 10px 0" }}>1. Shipping Address (Karnataka)</h4>
                <div className="amz-form-group" style={{ marginBottom: "10px" }}>
                  <label>Full Name</label>
                  <input value={shippingName} onChange={(e) => setShippingName(e.target.value)} />
                </div>
                <div className="amz-form-group" style={{ marginBottom: "10px" }}>
                  <label>Street Address</label>
                  <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="amz-form-group">
                    <label>City & State</label>
                    <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} />
                  </div>
                  <div className="amz-form-group">
                    <label>Pincode / Postal Code</label>
                    <input value={deliveryPincode} onChange={(e) => setDeliveryPincode(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <h4 style={{ margin: "16px 0 10px 0" }}>2. Select Payment Method</h4>
                <div className="amz-payment-options">
                  <div
                    className={`amz-payment-chip ${paymentMethod === "upi" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("upi")}
                  >
                    📱 UPI / QR (PhonePe, GPay, Paytm)
                  </div>
                  <div
                    className={`amz-payment-chip ${paymentMethod === "card" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    💳 RuPay / Debit / Credit Card
                  </div>
                  <div
                    className={`amz-payment-chip ${paymentMethod === "cod" ? "selected" : ""}`}
                    onClick={() => setPaymentMethod("cod")}
                  >
                    💵 Cash on Delivery (Doorstep)
                  </div>
                </div>
              </div>

              {/* Order Summary in Checkout */}
              <div
                style={{
                  background: "#f7f9fa",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  fontSize: "13px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Items Total ({cartItemCount})</span>
                  <span>{formatMoney(cartSubtotal, "INR")}</span>
                </div>
                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#388e3c", marginBottom: "6px" }}>
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-{formatMoney(discountAmount, "INR")}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "15px" }}>
                  <span>Grand Total</span>
                  <span>{formatMoney(cartTotal, "INR")}</span>
                </div>
              </div>
            </div>

            <div className="amz-modal-footer">
              <button className="amz-pill-btn" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </button>
              <button
                className="amz-btn-buy"
                style={{ minWidth: "160px" }}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Processing..." : `Place Order (${formatMoney(cartTotal, "INR")})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRODUCT DETAILS QUICK-MODAL */}
      {selectedProduct && (
        <div className="amz-modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="amz-modal-card" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <div className="amz-modal-header">
              <h3>{selectedProduct.name}</h3>
              <button className="amz-close-btn" style={{ color: "#111" }} onClick={() => setSelectedProduct(null)}>
                ✕
              </button>
            </div>

            <div className="amz-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
                <img
                  src={
                    selectedProduct.imageUrl ??
                    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
                  }
                  alt={selectedProduct.name}
                  style={{ width: "100%", height: "240px", objectFit: "cover", borderRadius: "8px" }}
                />
                <div>
                  <div className="amz-card-category">{typeof selectedProduct.category === "string" ? selectedProduct.category : "General"}</div>
                  <div className="amz-card-rating">
                    <span className="amz-stars">★★★★★</span>
                    <span className="amz-rating-score">{selectedProduct.rating ?? 4.8}</span>
                    <span className="amz-review-count">({selectedProduct.reviewCount ?? 1200} reviews)</span>
                  </div>
                  <div className="amz-price-main" style={{ margin: "10px 0" }}>
                    {formatMoney(selectedProduct.inventoryItems[0]?.priceCents ?? 0, "INR")}
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {selectedProduct.description}
                  </p>
                  <div style={{ fontSize: "12px", color: "var(--success-green)", fontWeight: 700 }}>
                    ✓ {selectedProduct.inventoryItems[0]?.stockCount ?? 0} units available in inventory
                  </div>
                </div>
              </div>
            </div>

            <div className="amz-modal-footer">
              <button className="amz-pill-btn" onClick={() => setSelectedProduct(null)}>
                Close
              </button>
              <button
                className="amz-btn-cart"
                onClick={() => {
                  void handleAddToCart(selectedProduct, true);
                  setSelectedProduct(null);
                }}
              >
                Add to Cart
              </button>
              <button
                className="amz-btn-buy"
                onClick={() => {
                  void handleBuyNow(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CUSTOMER AUTH MODAL */}
      {isAuthOpen && (
        <div className="amz-modal-backdrop" onClick={() => setIsAuthOpen(false)}>
          <div className="amz-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="amz-modal-header">
              <h3>{authMode === "login" ? "Sign-In to ShopSwift" : "Create Account"}</h3>
              <button className="amz-close-btn" style={{ color: "#111" }} onClick={() => setIsAuthOpen(false)}>
                ✕
              </button>
            </div>

            <div className="amz-modal-body">
              {authMode === "register" && (
                <>
                  <div className="amz-role-selector" style={{ marginBottom: "14px" }}>
                    <button
                      type="button"
                      className={`amz-role-btn ${registerRole === "CUSTOMER" ? "active" : ""}`}
                      onClick={() => setRegisterRole("CUSTOMER")}
                    >
                      🛒 Customer
                    </button>
                    <button
                      type="button"
                      className={`amz-role-btn ${registerRole === "ADMIN" ? "active" : ""}`}
                      onClick={() => setRegisterRole("ADMIN")}
                    >
                      🛡️ Store Admin
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="amz-form-group">
                      <label>First Name</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="amz-form-group">
                      <label>Last Name</label>
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div className="amz-form-group">
                <label>Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>

              <div className="amz-form-group">
                <label>Password (min 8 characters)</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
              </div>

              <button
                className="amz-btn-buy"
                style={{ width: "100%", marginTop: "10px" }}
                onClick={authMode === "login" ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading ? "Please wait..." : authMode === "login" ? "Sign In" : `Register as ${registerRole === "ADMIN" ? "Admin" : "Customer"}`}
              </button>

              <div style={{ textAlign: "center", fontSize: "13px", marginTop: "12px" }}>
                {authMode === "login" ? (
                  <span>
                    New to ShopSwift?{" "}
                    <button
                      className="amz-item-remove"
                      onClick={() => setAuthMode("register")}
                      style={{ fontWeight: 700 }}
                    >
                      Create your account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      className="amz-item-remove"
                      onClick={() => setAuthMode("login")}
                      style={{ fontWeight: 700 }}
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
