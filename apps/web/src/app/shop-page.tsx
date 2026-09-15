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
  const [authStage, setAuthStage] = useState<"enter_email" | "enter_password" | "login_otp" | "create_account" | "verify_signup_otp">("enter_email");
  const [registerRole, setRegisterRole] = useState<"CUSTOMER" | "ADMIN">("CUSTOMER");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOrdersView, setShowOrdersView] = useState(false);

  // Form states (Clean, empty by default)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [needHelpOpen, setNeedHelpOpen] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [pendingBuyProduct, setPendingBuyProduct] = useState<Product | null>(null);
  const [orderSuccessDetails, setOrderSuccessDetails] = useState<{ id: string; totalCents: number; paymentMethod?: string } | null>(null);

  const [couponInput, setCouponInput] = useState("NAMMAKARNATAKA");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountRate: number } | null>({
    code: "NAMMAKARNATAKA",
    discountRate: 0.25
  });
  const [deliveryPincode, setDeliveryPincode] = useState("560038");

  // Checkout address & payment (Clean, empty defaults)
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("Bengaluru, Karnataka");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cod">("cod");

  const [message, setMessage] = useState("Connecting to live store catalog...");
  const [loading, setLoading] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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

  const cartItemCount = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return Math.round(cartSubtotal * appliedCoupon.discountRate);
  }, [cartSubtotal, appliedCoupon]);

  const deliveryFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 49900 ? 0 : 4000;
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal + deliveryFee - discountAmount);
  }, [cartSubtotal, deliveryFee, discountAmount]);

  useEffect(() => {
    const storedSession = window.localStorage.getItem("session");
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession) as AuthSession;
        setSession(parsedSession);
        if (parsedSession.user.firstName || parsedSession.user.lastName) {
          setShippingName(`${parsedSession.user.firstName ?? ""} ${parsedSession.user.lastName ?? ""}`.trim());
        }
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
      setMessage("🟢 Connected to live store & PostgreSQL catalog.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load products from server.");
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
      window.localStorage.removeItem("session");
      setSession(null);
      setCart(null);
      setOrders([]);
    }
  }

  function openAuthModal(stage: "enter_email" | "enter_password" | "login_otp" | "create_account" | "verify_signup_otp" = "enter_email") {
    setAuthStage(stage);
    setAuthError(null);
    setAuthNotice(null);
    setOtp("");
    setIsAuthOpen(true);
  }

  async function handleContinueEmail() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthError("Enter your email or mobile phone number");
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setAuthError("Please enter a valid email address");
      return;
    }

    setAuthError(null);
    setAuthNotice(null);
    setLoading(true);
    try {
      const res = await api.checkEmail(cleanEmail);
      if (res.exists) {
        setAuthStage("enter_password");
      } else {
        setAuthStage("create_account");
        setAuthNotice("We couldn't find an account associated with that email. Let's create your account!");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Unable to verify email.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthStage("enter_email");
      return;
    }
    if (!password) {
      setAuthError("Enter your password");
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const nextSession = await api.login(cleanEmail, password);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      if (!shippingName && (nextSession.user.firstName || nextSession.user.lastName)) {
        setShippingName(`${nextSession.user.firstName ?? ""} ${nextSession.user.lastName ?? ""}`.trim());
      }
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setMessage(`Signed in as ${nextSession.user.email}`);

      if (pendingBuyProduct) {
        await handleAddToCart(pendingBuyProduct, false);
        setPendingBuyProduct(null);
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Incorrect password. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestLoginOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setAuthStage("enter_email");
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const res = await api.sendLoginOtp(cleanEmail);
      setDevOtp(res.devOtp || null);
      setOtpCountdown(30);
      setOtp("");
      setAuthStage("login_otp");
      setMessage(res.message || `Verification code sent to ${cleanEmail}`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyLoginOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError("Please enter the complete 6-digit verification code.");
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const nextSession = await api.verifyLoginOtp(cleanEmail, cleanOtp);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      if (!shippingName && (nextSession.user.firstName || nextSession.user.lastName)) {
        setShippingName(`${nextSession.user.firstName ?? ""} ${nextSession.user.lastName ?? ""}`.trim());
      }
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setMessage(`Signed in as ${nextSession.user.email}`);

      if (pendingBuyProduct) {
        await handleAddToCart(pendingBuyProduct, false);
        setPendingBuyProduct(null);
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendSignupOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!firstName.trim()) {
      setAuthError("Enter your name");
      return;
    }
    if (!cleanEmail) {
      setAuthError("Enter your email");
      return;
    }
    if (!password) {
      setAuthError("Enter a password");
      return;
    }
    if (password.length < 8) {
      setAuthError("Passwords must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords must match");
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const res = await api.sendSignupOtp({
        email: cleanEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: registerRole
      });
      setDevOtp(res.devOtp || null);
      setOtpCountdown(30);
      setOtp("");
      setAuthStage("verify_signup_otp");
      setMessage(res.message || `Verification code sent to ${cleanEmail}`);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySignupOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setAuthError("Please enter the complete 6-digit verification code.");
      return;
    }

    setAuthError(null);
    setLoading(true);
    try {
      const nextSession = await api.verifySignupOtp({
        email: cleanEmail,
        otp: cleanOtp
      });
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      if (!shippingName && (nextSession.user.firstName || nextSession.user.lastName)) {
        setShippingName(`${nextSession.user.firstName ?? ""} ${nextSession.user.lastName ?? ""}`.trim());
      }
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setDevOtp(null);
      setMessage(`🎉 Welcome to ShopSwift, ${nextSession.user.firstName || nextSession.user.email}!`);

      if (pendingBuyProduct) {
        await handleAddToCart(pendingBuyProduct, false);
        setPendingBuyProduct(null);
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLoginClick() {
    const dummyGoogleEmail = email.trim() || prompt("Enter your Google Account email:", "user@gmail.com");
    if (!dummyGoogleEmail) return;

    setLoading(true);
    try {
      const mockPayload = {
        email: dummyGoogleEmail,
        name: dummyGoogleEmail.split("@")[0],
        given_name: dummyGoogleEmail.split("@")[0],
        family_name: "GoogleUser",
        sub: "google_" + Math.random().toString(36).slice(2)
      };
      const mockCredential = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      const nextSession = await api.googleLogin(mockCredential);
      setSession(nextSession);
      window.localStorage.setItem("session", JSON.stringify(nextSession));
      if (!shippingName && (nextSession.user.firstName || nextSession.user.lastName)) {
        setShippingName(`${nextSession.user.firstName ?? ""} ${nextSession.user.lastName ?? ""}`.trim());
      }
      await refreshCustomerData(nextSession.tokens.accessToken);
      setIsAuthOpen(false);
      setMessage(`Signed in via Google as ${nextSession.user.email}`);

      if (pendingBuyProduct) {
        await handleAddToCart(pendingBuyProduct, false);
        setPendingBuyProduct(null);
        setIsCheckoutOpen(true);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed.");
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
      openAuthModal("enter_email");
      setMessage("Please sign in or create an account to add items to your cart.");
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
    if (!session) {
      setPendingBuyProduct(product);
      openAuthModal("enter_email");
      setMessage("Please sign in or create an account to proceed with instant checkout.");
      return;
    }

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
      setMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!shippingName.trim() || !shippingAddress.trim() || !shippingCity.trim() || !deliveryPincode.trim()) {
      setMessage("Please enter complete delivery address details (Name, Street, City, and Pincode).");
      return;
    }

    setLoading(true);
    try {
      const order = await api.checkout(session.tokens.accessToken, {
        paymentMethod,
        shippingAddress: {
          fullName: shippingName.trim(),
          street: shippingAddress.trim(),
          city: shippingCity.trim(),
          pincode: deliveryPincode.trim()
        },
        couponCode: appliedCoupon?.code
      });

      if (paymentMethod !== "cod") {
        try {
          await api.createPaymentIntent(session.tokens.accessToken, order.id);
        } catch {
          // Intent processed
        }
      }

      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setAppliedCoupon(null);
      setOrderSuccessDetails({
        id: order.id,
        totalCents: order.totalCents,
        paymentMethod
      });
      await refreshCustomerData(session.tokens.accessToken);
      setMessage(`🎉 Order placed successfully! Order ID: ${order.id.slice(0, 8)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed. Please verify inventory stock.");
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
              <div className="amz-nav-item" onClick={() => openAuthModal("enter_email")}>
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

      {/* 6.5. ORDER SUCCESS CONFIRMATION MODAL */}
      {orderSuccessDetails && (
        <div className="amz-modal-backdrop" onClick={() => setOrderSuccessDetails(null)}>
          <div className="amz-modal-card" style={{ maxWidth: "480px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "30px 20px" }}>
              <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>
              <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px 0", color: "#0f1111" }}>Order Placed Successfully!</h2>
              <p style={{ color: "#565959", fontSize: "14px", margin: "0 0 20px 0" }}>
                Thank you for your order. We have received your order and started processing it.
              </p>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", marginBottom: "20px", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Order Reference:</span>
                  <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>#{orderSuccessDetails.id.slice(0, 8).toUpperCase()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Amount:</span>
                  <strong style={{ color: "#0f172a" }}>{formatMoney(orderSuccessDetails.totalCents, "INR")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Payment Method:</span>
                  <strong style={{ color: "#0f172a" }}>
                    {orderSuccessDetails.paymentMethod === "cod" ? "💵 Cash on Delivery (Doorstep)" : orderSuccessDetails.paymentMethod === "upi" ? "📱 UPI / QR Instant" : "💳 Card Payment"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>Delivery Address:</span>
                  <span style={{ color: "#0f172a", maxWidth: "240px", textAlign: "right", fontWeight: 500 }}>
                    {shippingName}, {shippingCity} - {deliveryPincode}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="amz-btn-buy"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setOrderSuccessDetails(null);
                    setShowOrdersView(true);
                  }}
                >
                  View Your Orders
                </button>
                <button
                  className="amz-pill-btn"
                  style={{ flex: 1 }}
                  onClick={() => setOrderSuccessDetails(null)}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. AMAZON OFFICIAL MULTI-STEP AUTHENTICATION MODAL */}
      {isAuthOpen && (
        <div className="amz-modal-backdrop" onClick={() => setIsAuthOpen(false)}>
          <div
            className="amz-auth-card"
            style={{ position: "relative", zIndex: 301, margin: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              className="amz-close-btn"
              style={{ position: "absolute", top: "14px", right: "14px", color: "#565959", fontSize: "16px", cursor: "pointer", background: "none", border: "none" }}
              onClick={() => setIsAuthOpen(false)}
              aria-label="Close dialog"
            >
              ✕
            </button>

            {/* Amazon Logo / Brand */}
            <div className="amz-auth-brand">
              <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                <span style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", color: "#0f1111" }}>
                  amazon<span style={{ color: "#febd69" }}>.in</span>
                </span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#e47911", marginLeft: "4px" }}>
                  ShopSwift
                </span>
              </div>
            </div>

            {/* Global Error Banner */}
            {authError && (
              <div className="amz-auth-alert-error">
                <div className="alert-icon">!</div>
                <div>
                  <div className="alert-title">There was a problem</div>
                  <div className="alert-body">{authError}</div>
                </div>
              </div>
            )}

            {/* Global Notice Banner */}
            {authNotice && (
              <div className="amz-auth-alert-notice">
                <span style={{ fontSize: "18px" }}>ℹ️</span>
                <div>{authNotice}</div>
              </div>
            )}

            {/* STAGE 1: ENTER EMAIL */}
            {authStage === "enter_email" && (
              <div>
                <h1 className="amz-auth-heading">Sign in</h1>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleContinueEmail();
                  }}
                >
                  <div className="amz-auth-field">
                    <label className="amz-auth-label">Email or mobile phone number</label>
                    <input
                      className="amz-auth-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="text"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="amz-auth-btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Continuing..." : "Continue"}
                  </button>
                </form>

                <p className="amz-auth-legal">
                  By continuing, you agree to Amazon's{" "}
                  <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
                </p>

                {/* Need Help Accordion */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    className="amz-auth-link"
                    style={{ fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    onClick={() => setNeedHelpOpen(!needHelpOpen)}
                  >
                    <span>{needHelpOpen ? "▾" : "▸"}</span> Need help?
                  </div>
                  {needHelpOpen && (
                    <div style={{ paddingLeft: "14px", marginTop: "8px", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <a href="#" className="amz-auth-link">Forgot your password?</a>
                      <a href="#" className="amz-auth-link">Other issues with Sign-In</a>
                    </div>
                  )}
                </div>

                {/* Divider for Create Account */}
                <div className="amz-auth-divider">
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">New to Amazon?</span>
                  <div className="amz-auth-divider-line" />
                </div>

                <button
                  type="button"
                  className="amz-auth-btn-secondary"
                  onClick={() => {
                    setAuthError(null);
                    setAuthNotice(null);
                    setAuthStage("create_account");
                  }}
                >
                  Create your Amazon account
                </button>

                {/* Divider for Google */}
                <div className="amz-auth-divider" style={{ marginTop: "16px", marginBottom: "8px" }}>
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">or continue with</span>
                  <div className="amz-auth-divider-line" />
                </div>

                <button
                  type="button"
                  className="amz-auth-google-btn"
                  onClick={handleGoogleLoginClick}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {/* STAGE 2A: ENTER PASSWORD */}
            {authStage === "enter_password" && (
              <div>
                <h1 className="amz-auth-heading">Sign in</h1>

                <div className="amz-auth-user-display">
                  <span>{email}</span>
                  <button
                    type="button"
                    className="amz-auth-change-link"
                    onClick={() => {
                      setAuthError(null);
                      setAuthStage("enter_email");
                    }}
                  >
                    Change
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handlePasswordLogin();
                  }}
                >
                  <div className="amz-auth-field">
                    <div className="amz-auth-label">
                      <span>Password</span>
                      <a href="#" className="amz-auth-link" style={{ fontSize: "12px", fontWeight: 400 }}>
                        Forgot your password?
                      </a>
                    </div>
                    <input
                      className="amz-auth-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="amz-auth-btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      id="keepSignedIn"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      style={{ accentColor: "#e77600", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="keepSignedIn" style={{ color: "#0f1111", cursor: "pointer" }}>
                      Keep me signed in
                    </label>
                  </div>
                </form>

                {/* Divider for OTP Login */}
                <div className="amz-auth-divider">
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">or</span>
                  <div className="amz-auth-divider-line" />
                </div>

                <button
                  type="button"
                  className="amz-auth-btn-secondary"
                  onClick={handleRequestLoginOtp}
                  disabled={loading}
                >
                  Get an OTP on your email
                </button>
              </div>
            )}

            {/* STAGE 2B: LOGIN WITH OTP */}
            {authStage === "login_otp" && (
              <div>
                <h1 className="amz-auth-heading">Sign in with OTP</h1>

                <div className="amz-auth-user-display" style={{ marginBottom: "16px" }}>
                  <span>We've sent a 6-digit OTP to <strong>{email}</strong></span>
                  <button
                    type="button"
                    className="amz-auth-change-link"
                    onClick={() => {
                      setAuthError(null);
                      setAuthStage("enter_email");
                    }}
                  >
                    Change
                  </button>
                </div>

                {devOtp && (
                  <div className="amz-auth-dev-otp">
                    💡 <strong>Development OTP:</strong>{" "}
                    <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "bold" }}>{devOtp}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleVerifyLoginOtp();
                  }}
                >
                  <div className="amz-auth-field">
                    <label className="amz-auth-label">Enter OTP</label>
                    <input
                      className="amz-auth-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      style={{ fontSize: "22px", textAlign: "center", letterSpacing: "6px", fontFamily: "monospace" }}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="amz-auth-btn-primary"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "13px" }}>
                  <button
                    type="button"
                    className="amz-auth-link"
                    style={{ background: "none", border: "none", padding: 0 }}
                    onClick={() => {
                      setAuthError(null);
                      setAuthStage("enter_password");
                    }}
                  >
                    Sign in with password
                  </button>

                  <button
                    type="button"
                    className="amz-auth-link"
                    style={{ background: "none", border: "none", padding: 0, color: otpCountdown > 0 ? "#888c8c" : "#007185" }}
                    onClick={handleRequestLoginOtp}
                    disabled={otpCountdown > 0 || loading}
                  >
                    {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: CREATE ACCOUNT */}
            {authStage === "create_account" && (
              <div>
                <h1 className="amz-auth-heading">Create Account</h1>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendSignupOtp();
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="amz-auth-field">
                      <label className="amz-auth-label">First name</label>
                      <input
                        className="amz-auth-input"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        autoFocus
                        required
                      />
                    </div>
                    <div className="amz-auth-field">
                      <label className="amz-auth-label">Last name</label>
                      <input
                        className="amz-auth-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="amz-auth-field">
                    <div className="amz-auth-label">
                      <span>Email</span>
                      <button
                        type="button"
                        className="amz-auth-change-link"
                        onClick={() => {
                          setAuthError(null);
                          setAuthStage("enter_email");
                        }}
                      >
                        Change
                      </button>
                    </div>
                    <input
                      className="amz-auth-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="amz-auth-field">
                    <label className="amz-auth-label">Password</label>
                    <input
                      className="amz-auth-input"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                    <span style={{ fontSize: "11px", color: "#565959", marginTop: "2px" }}>
                      ⓘ Passwords must be at least 8 characters.
                    </span>
                  </div>

                  <div className="amz-auth-field">
                    <label className="amz-auth-label">Re-enter password</label>
                    <input
                      className="amz-auth-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="amz-auth-btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify email"}
                  </button>
                </form>

                <p className="amz-auth-legal">
                  By creating an account, you agree to Amazon's{" "}
                  <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
                </p>

                <div className="amz-auth-divider">
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">Already have an account?</span>
                  <div className="amz-auth-divider-line" />
                </div>

                <div style={{ textAlign: "center", fontSize: "13px" }}>
                  <a
                    href="#"
                    className="amz-auth-link"
                    style={{ fontWeight: 700 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthError(null);
                      setAuthNotice(null);
                      setAuthStage("enter_email");
                    }}
                  >
                    Sign in ▸
                  </a>
                </div>

                {/* Divider for Google */}
                <div className="amz-auth-divider" style={{ marginTop: "16px", marginBottom: "8px" }}>
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">or register with</span>
                  <div className="amz-auth-divider-line" />
                </div>

                <button
                  type="button"
                  className="amz-auth-google-btn"
                  onClick={handleGoogleLoginClick}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            {/* STAGE 4: VERIFY SIGNUP OTP */}
            {authStage === "verify_signup_otp" && (
              <div>
                <h1 className="amz-auth-heading">Verify email address</h1>

                <div className="amz-auth-user-display" style={{ marginBottom: "16px" }}>
                  <span>To verify your email, we've sent a One Time Password (OTP) to <strong>{email}</strong></span>
                  <button
                    type="button"
                    className="amz-auth-change-link"
                    onClick={() => {
                      setAuthError(null);
                      setAuthStage("create_account");
                    }}
                  >
                    (Change)
                  </button>
                </div>

                {devOtp && (
                  <div className="amz-auth-dev-otp">
                    💡 <strong>Development Code:</strong>{" "}
                    <span style={{ fontFamily: "monospace", fontSize: "16px", fontWeight: "bold" }}>{devOtp}</span>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleVerifySignupOtp();
                  }}
                >
                  <div className="amz-auth-field">
                    <label className="amz-auth-label">Enter OTP</label>
                    <input
                      className="amz-auth-input"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                      style={{ fontSize: "22px", textAlign: "center", letterSpacing: "6px", fontFamily: "monospace" }}
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="amz-auth-btn-primary"
                    disabled={loading || otp.length < 6}
                  >
                    {loading ? "Verifying..." : "Create your Amazon account"}
                  </button>
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "13px" }}>
                  <button
                    type="button"
                    className="amz-auth-link"
                    style={{ background: "none", border: "none", padding: 0 }}
                    onClick={() => {
                      setAuthError(null);
                      setAuthStage("create_account");
                    }}
                  >
                    ← Edit details
                  </button>

                  <button
                    type="button"
                    className="amz-auth-link"
                    style={{ background: "none", border: "none", padding: 0, color: otpCountdown > 0 ? "#888c8c" : "#007185" }}
                    onClick={handleSendSignupOtp}
                    disabled={otpCountdown > 0 || loading}
                  >
                    {otpCountdown > 0 ? `Resend OTP in ${otpCountdown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
