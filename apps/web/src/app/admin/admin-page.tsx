"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  api,
  formatMoney,
  type AdminOrder,
  type AdminUser,
  type AuthSession,
  type Category,
  type OrderStatus,
  type Product
} from "../../lib/api";

const PRESET_IMAGES = [
  { label: "Mysore Silk Saree", url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80" },
  { label: "Coorg Arabica Coffee", url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80" },
  { label: "Masala Dosa & Kaapi", url: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80" },
  { label: "Mysore Pak Box", url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80" },
  { label: "Royal Dum Biryani", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" },
  { label: "MacBook Laptop", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80" },
  { label: "Wireless Headphones", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" },
  { label: "Smartphone", url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80" },
  { label: "Smartwatch", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80" },
  { label: "Running Shoes", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80" },
  { label: "Streetwear Hoodie", url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80" },
  { label: "Gaming Keyboard", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80" }
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80";

export function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Amazon multi-step auth form
  const [authStage, setAuthStage] = useState<"enter_email" | "enter_password" | "login_otp" | "create_account" | "verify_signup_otp">("enter_email");
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

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "users" | "categories">("products");
  const [orderFilter, setOrderFilter] = useState<"ALL" | OrderStatus>("ALL");

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // New Product form fields
  const [newProductName, setNewProductName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPriceRupees, setNewPriceRupees] = useState(1499);
  const [newStockCount, setNewStockCount] = useState(25);
  const [newImageUrl, setNewImageUrl] = useState(DEFAULT_IMAGE);
  const [newBadge, setNewBadge] = useState("Prime Assured");
  const [newDescription, setNewDescription] = useState("");

  // New Category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const [message, setMessage] = useState("Sign in or register an Admin account to manage store operations.");
  const [loading, setLoading] = useState(false);

  // Auto load stored session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("admin_session");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthSession;
          if (parsed.user.role === "ADMIN") {
            setSession(parsed);
            void refreshAdminData(parsed.tokens.accessToken);
          }
        } catch {
          window.localStorage.removeItem("admin_session");
        }
      }
    }
  }, []);

  async function refreshAdminData(accessToken = session?.tokens.accessToken) {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [cats, prods, ords, usrs] = await Promise.all([
        api.adminCategories(accessToken).catch(() => []),
        api.products().catch(() => []),
        api.adminOrders(accessToken).catch(() => []),
        api.adminUsers(accessToken).catch(() => [])
      ]);

      setCategories(cats);
      setProducts(prods);
      setOrders(ords);
      setUsers(usrs);
      if (!newCategoryId && cats.length > 0) {
        setNewCategoryId(cats[0]?.id || "");
      }
      setMessage("Catalog, orders, and user directory synced.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error refreshing admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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
        setAuthNotice("No Seller account found for this email. Complete registration below to create your Administrator account.");
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
      if (nextSession.user.role !== "ADMIN") {
        setAuthError("Access denied: This portal requires an ADMIN role account.");
        return;
      }
      setSession(nextSession);
      window.localStorage.setItem("admin_session", JSON.stringify(nextSession));
      setMessage(`Welcome back, ${nextSession.user.firstName || nextSession.user.email}!`);
      await refreshAdminData(nextSession.tokens.accessToken);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Sign in failed. Check your password.");
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
      if (nextSession.user.role !== "ADMIN") {
        setAuthError("Access denied: This portal requires an ADMIN role account.");
        return;
      }
      setSession(nextSession);
      window.localStorage.setItem("admin_session", JSON.stringify(nextSession));
      setMessage(`Welcome back, ${nextSession.user.firstName || nextSession.user.email}!`);
      await refreshAdminData(nextSession.tokens.accessToken);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Invalid or expired verification code.");
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
        role: "ADMIN"
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
      if (nextSession.user.role !== "ADMIN") {
        setAuthError("Access denied: User account is not an ADMIN role.");
        return;
      }
      setSession(nextSession);
      window.localStorage.setItem("admin_session", JSON.stringify(nextSession));
      setMessage(`🎉 Welcome to Seller Central, ${nextSession.user.firstName || nextSession.user.email}!`);
      await refreshAdminData(nextSession.tokens.accessToken);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLoginClick() {
    const dummyGoogleEmail = email.trim() || prompt("Enter your Google Account email for Admin:", "seller@amazon.in");
    if (!dummyGoogleEmail) return;

    setLoading(true);
    try {
      const mockPayload = {
        email: dummyGoogleEmail,
        name: dummyGoogleEmail.split("@")[0],
        given_name: dummyGoogleEmail.split("@")[0],
        family_name: "SellerAdmin",
        sub: "google_admin_" + Math.random().toString(36).slice(2)
      };
      const mockCredential = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      const nextSession = await api.googleLogin(mockCredential);
      if (nextSession.user.role !== "ADMIN") {
        setAuthError("Access denied: This portal requires an ADMIN role account. Please contact system admin.");
        return;
      }
      setSession(nextSession);
      window.localStorage.setItem("admin_session", JSON.stringify(nextSession));
      setMessage(`Signed in via Google as ${nextSession.user.email}`);
      await refreshAdminData(nextSession.tokens.accessToken);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    window.localStorage.removeItem("admin_session");
    setMessage("Signed out from Seller Central.");
  }

  // Unified Product Creation
  async function handleCreateFullProduct() {
    if (!session) return;
    if (!newProductName.trim()) {
      setMessage("Please enter a product name.");
      return;
    }
    if (!newCategoryId) {
      setMessage("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const generatedSku = newSku.trim() || `${newProductName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const priceCents = Math.round(newPriceRupees * 100);

      await api.adminCreateFullProduct(session.tokens.accessToken, {
        categoryId: newCategoryId,
        name: newProductName,
        description: newDescription || `${newProductName} with premium quality guarantee.`,
        sku: generatedSku,
        stockCount: newStockCount,
        priceCents,
        imageUrl: newImageUrl,
        badge: newBadge
      });

      setMessage(`Product "${newProductName}" published with SKU ${generatedSku}!`);
      setIsAddProductOpen(false);
      setNewProductName("");
      setNewSku("");
      setNewDescription("");
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to publish product.");
    } finally {
      setLoading(false);
    }
  }

  // Delete product
  async function handleDeleteProduct(productId: string, productName: string) {
    if (!session) return;
    if (!window.confirm(`Are you sure you want to remove "${productName}" from the catalog?`)) return;

    setLoading(true);
    try {
      await api.adminDeleteProduct(session.tokens.accessToken, productId);
      setMessage(`Removed "${productName}" from catalog.`);
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setLoading(false);
    }
  }

  // Quick update inventory
  async function handleQuickStockUpdate(inventoryItemId: string, nextStock: number) {
    if (!session || nextStock < 0) return;
    setLoading(true);
    try {
      await api.adminUpdateInventory(session.tokens.accessToken, inventoryItemId, { stockCount: nextStock });
      setMessage("Stock count updated.");
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update stock.");
    } finally {
      setLoading(false);
    }
  }

  // Update order status
  async function handleUpdateOrderStatus(orderId: string, status: OrderStatus) {
    if (!session) return;
    setLoading(true);
    try {
      await api.adminUpdateOrderStatus(session.tokens.accessToken, orderId, status);
      setMessage(`Order ${orderId.slice(0, 8)} status updated to ${status}.`);
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to update order status.");
    } finally {
      setLoading(false);
    }
  }

  // Create Category
  async function handleCreateCategory() {
    if (!session || !newCatName.trim()) return;
    setLoading(true);
    try {
      await api.adminCreateCategory(session.tokens.accessToken, {
        name: newCatName,
        description: newCatDesc || `${newCatName} category`
      });
      setMessage(`Category "${newCatName}" created.`);
      setIsAddCategoryOpen(false);
      setNewCatName("");
      setNewCatDesc("");
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setLoading(false);
    }
  }

  // Delete Category
  async function handleDeleteCategory(categoryId: string, name: string) {
    if (!session) return;
    if (!window.confirm(`Delete category "${name}"?`)) return;
    setLoading(true);
    try {
      await api.adminDeleteCategory(session.tokens.accessToken, categoryId);
      setMessage(`Category "${name}" deleted.`);
      await refreshAdminData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  }

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalRevenueCents = orders
      .filter((o) => o.status === "PAID" || o.status === "SHIPPED")
      .reduce((sum, o) => sum + o.totalCents, 0);

    const activeSkus = products.reduce((sum, p) => sum + p.inventoryItems.length, 0);
    const lowStockAlerts = products.filter((p) => (p.inventoryItems[0]?.stockCount ?? 0) <= 15).length;

    return {
      revenue: formatMoney(totalRevenueCents, "INR"),
      orderCount: orders.length,
      skus: activeSkus,
      lowStock: lowStockAlerts,
      userCount: users.length
    };
  }, [orders, products, users]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "ALL") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  return (
    <div className="admin-shell">
      {/* 1. TOP SELLER CENTRAL HEADER */}
      <header className="admin-header">
        <div className="admin-topbar">
          <div className="admin-brand">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffa41c" strokeWidth="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>amazon|flipkart</span>
              <span className="admin-logo-badge">Seller Central</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <Link href="/" className="admin-btn-secondary">
              🛒 View Storefront
            </Link>
            {session ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>
                  👤 {session.user.firstName || session.user.email} (ADMIN)
                </span>
                <button className="admin-btn-secondary" onClick={() => refreshAdminData()} disabled={loading}>
                  🔄 Sync
                </button>
                <button
                  className="admin-btn-secondary"
                  style={{ background: "#334155", borderColor: "#475569" }}
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* 2. AUTHENTICATION SECTION (IF NOT LOGGED IN - AMAZON SELLER CENTRAL MULTI-STEP LOGIN) */}
      {!session ? (
        <main className="admin-main" style={{ maxWidth: "440px", marginTop: "40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="amz-auth-card" style={{ width: "100%", padding: "28px 30px" }}>
            {/* Amazon Seller Central Brand Header */}
            <div className="amz-auth-brand" style={{ flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px", color: "#0f1111" }}>
                  amazon<span style={{ color: "#ffa41c" }}>.in</span>
                </span>
                <span className="admin-logo-badge" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  Seller Central
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#565959", fontWeight: 600 }}>Administrator Portal</span>
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
                  By continuing, you agree to Amazon Seller Central's{" "}
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
                      <a href="#" className="amz-auth-link">Seller account support</a>
                    </div>
                  )}
                </div>

                {/* Divider for Create Seller Account */}
                <div className="amz-auth-divider">
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">New to Seller Central?</span>
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
                  Create your Amazon Seller account
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
                    {loading ? "Signing in..." : "Sign in as Admin"}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      id="keepAdminSignedIn"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      style={{ accentColor: "#e77600", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="keepAdminSignedIn" style={{ color: "#0f1111", cursor: "pointer" }}>
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
                    {loading ? "Signing in..." : "Sign in as Admin"}
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

            {/* STAGE 3: CREATE SELLER ACCOUNT */}
            {authStage === "create_account" && (
              <div>
                <h1 className="amz-auth-heading">Create Seller Account</h1>
                <p style={{ fontSize: "13px", color: "#565959", margin: "0 0 14px 0" }}>
                  Registering administrator account for store management.
                </p>

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
                  By creating an account, you agree to Amazon Seller Central's{" "}
                  <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
                </p>

                <div className="amz-auth-divider">
                  <div className="amz-auth-divider-line" />
                  <span className="amz-auth-divider-text">Already have a seller account?</span>
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
                    {loading ? "Verifying..." : "Create your Amazon Seller account"}
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
          <div className="admin-status-bar" style={{ width: "100%", marginTop: "16px" }}>{message}</div>
        </main>
      ) : (
        /* 3. LOGGED-IN ADMIN CONSOLE */
        <main className="admin-main">
          {/* Status Bar */}
          <div className="admin-status-bar">
            <span>📢 {message}</span>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>Live Database & Redis Synced</span>
          </div>

          {/* KPI Stat Cards */}
          <section className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h4>Total Revenue</h4>
                <div className="kpi-num">{kpis.revenue}</div>
                <div className="kpi-sub">↑ From verified paid orders</div>
              </div>
              <div className="admin-kpi-icon kpi-icon-green">💰</div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h4>Total Orders</h4>
                <div className="kpi-num">{kpis.orderCount}</div>
                <div className="kpi-sub">Across all statuses</div>
              </div>
              <div className="admin-kpi-icon kpi-icon-blue">📦</div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h4>Active SKUs</h4>
                <div className="kpi-num">{kpis.skus}</div>
                <div className="kpi-sub">{products.length} Products published</div>
              </div>
              <div className="admin-kpi-icon kpi-icon-orange">🏷️</div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h4>Low Stock Alerts</h4>
                <div className="kpi-num" style={{ color: kpis.lowStock > 0 ? "#b45309" : "#15803d" }}>
                  {kpis.lowStock}
                </div>
                <div className="kpi-sub">{kpis.lowStock > 0 ? "Items require restocking" : "All stock healthy"}</div>
              </div>
              <div className="admin-kpi-icon kpi-icon-purple">⚠️</div>
            </div>

            <div className="admin-kpi-card">
              <div className="admin-kpi-info">
                <h4>Registered Users</h4>
                <div className="kpi-num">{kpis.userCount}</div>
                <div className="kpi-sub">Admins & Customers</div>
              </div>
              <div className="admin-kpi-icon kpi-icon-blue">👥</div>
            </div>
          </section>

          {/* Tab Navigation */}
          <nav className="admin-tabs">
            <button
              className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <span>📦 Products & Inventory</span>
              <span className="admin-tab-count">{products.length}</span>
            </button>
            <button
              className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <span>🛒 Orders & Fulfillment</span>
              <span className="admin-tab-count">{orders.length}</span>
            </button>
            <button
              className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <span>👥 Users & Admins</span>
              <span className="admin-tab-count">{users.length}</span>
            </button>
            <button
              className={`admin-tab ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <span>📁 Categories</span>
              <span className="admin-tab-count">{categories.length}</span>
            </button>
          </nav>

          {/* TAB 1: PRODUCTS & INVENTORY */}
          {activeTab === "products" && (
            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Product Catalog & Real-Time Stock</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                    Manage products, pricing, deal badges, and instant stock levels.
                  </p>
                </div>
                <button className="admin-btn-primary" onClick={() => setIsAddProductOpen(true)}>
                  + Add New Product
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Stock Quantity</th>
                      <th>Badge</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!products.length ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          No products found. Click "+ Add New Product" to create one.
                        </td>
                      </tr>
                    ) : null}
                    {products.map((p) => {
                      const inv = p.inventoryItems[0];
                      const stock = inv?.stockCount ?? 0;
                      const price = inv?.priceCents ?? 0;

                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="admin-product-cell">
                              <img
                                src={p.imageUrl || DEFAULT_IMAGE}
                                alt={p.name}
                                className="admin-product-thumb"
                              />
                              <div>
                                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{p.name}</strong>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>slug: {p.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge-tag badge-tag-customer">{typeof p.category === "string" ? p.category : "General"}</span>
                          </td>
                          <td>
                            <code>{inv?.sku ?? "N/A"}</code>
                          </td>
                          <td>
                            <strong>{formatMoney(price, inv?.currency ?? "INR")}</strong>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                className={
                                  stock <= 0
                                    ? "badge-stock-out"
                                    : stock <= 15
                                      ? "badge-stock-low"
                                      : "badge-stock-ok"
                                }
                              >
                                {stock} in stock
                              </span>
                              {inv && (
                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button
                                    className="admin-btn-secondary"
                                    style={{ padding: "2px 8px", fontSize: "11px", color: "#1e293b", borderColor: "#cbd5e1" }}
                                    onClick={() => handleQuickStockUpdate(inv.id, stock + 10)}
                                    title="Add 10 units"
                                  >
                                    +10
                                  </button>
                                  <button
                                    className="admin-btn-secondary"
                                    style={{ padding: "2px 8px", fontSize: "11px", color: "#1e293b", borderColor: "#cbd5e1" }}
                                    onClick={() => handleQuickStockUpdate(inv.id, Math.max(0, stock - 1))}
                                    title="Reduce 1 unit"
                                  >
                                    -1
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="badge-tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                              {p.badge || "Standard"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="admin-btn-delete"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 2: ORDERS & FULFILLMENT */}
          {activeTab === "orders" && (
            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Customer Orders & Lifecycle State</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                    Advance orders through the fulfillment pipeline: PENDING → PAID → SHIPPED → DELIVERED.
                  </p>
                </div>
                {/* Order Filters */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {(["ALL", "PENDING", "PAID", "SHIPPED", "CANCELLED"] as const).map((st) => (
                    <button
                      key={st}
                      className={`admin-btn-secondary ${orderFilter === st ? "active" : ""}`}
                      style={{
                        background: orderFilter === st ? "#131921" : "#ffffff",
                        color: orderFilter === st ? "#ffffff" : "#1e293b",
                        borderColor: orderFilter === st ? "#131921" : "#cbd5e1"
                      }}
                      onClick={() => setOrderFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Fulfillment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredOrders.length ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          No orders in {orderFilter} status. Place an order on the storefront to test.
                        </td>
                      </tr>
                    ) : null}
                    {filteredOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <code>#{o.id.slice(0, 8)}</code>
                        </td>
                        <td>
                          <strong>{o.user.email}</strong>
                        </td>
                        <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={{ fontSize: "12px" }}>
                            {o.items.map((it, idx) => (
                              <div key={idx}>
                                {it.name} × {it.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <strong>{formatMoney(o.totalCents, o.currency)}</strong>
                        </td>
                        <td>
                          <span
                            className="badge-tag"
                            style={{
                              background:
                                o.status === "PAID"
                                  ? "#dcfce7"
                                  : o.status === "SHIPPED"
                                    ? "#e0f2fe"
                                    : o.status === "PENDING"
                                      ? "#fef3c7"
                                      : "#fee2e2",
                              color:
                                o.status === "PAID"
                                  ? "#15803d"
                                  : o.status === "SHIPPED"
                                    ? "#0369a1"
                                    : o.status === "PENDING"
                                      ? "#b45309"
                                      : "#b91c1c"
                            }}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="admin-input"
                            style={{ height: "34px", padding: "0 8px", fontSize: "12px", fontWeight: 700 }}
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                            disabled={loading || o.status === "CANCELLED"}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID (Confirm)</option>
                            <option value="SHIPPED">SHIPPED (Dispatch)</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 3: USERS & ADMINS */}
          {activeTab === "users" && (
            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Registered Users & Access Roster</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                    Complete directory of all registered customers and administrators in PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Assigned Role</th>
                      <th>Account Status</th>
                      <th>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!users.length ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          No user directory loaded.
                        </td>
                      </tr>
                    ) : null}
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.firstName || u.lastName ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "Account"}</strong>
                        </td>
                        <td>
                          <code>{u.email}</code>
                        </td>
                        <td>
                          <span
                            className={`badge-tag ${u.role === "ADMIN" ? "badge-tag-admin" : "badge-tag-customer"}`}
                          >
                            {u.role === "ADMIN" ? "🛡️ ADMIN" : "🛒 CUSTOMER"}
                          </span>
                        </td>
                        <td>
                          <span className="badge-tag badge-tag-active">Active</span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* TAB 4: CATEGORIES */}
          {activeTab === "categories" && (
            <section className="admin-card">
              <div className="admin-card-header">
                <div>
                  <h3>Catalog Taxonomy & Categories</h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                    Configure top-level storefront groups and taxonomy slugs.
                  </p>
                </div>
                <button className="admin-btn-primary" onClick={() => setIsAddCategoryOpen(true)}>
                  + Add Category
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!categories.length ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          No categories loaded.
                        </td>
                      </tr>
                    ) : null}
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>
                          <code>{c.slug}</code>
                        </td>
                        <td>{c.description || "No description"}</td>
                        <td>
                          <button
                            className="admin-btn-delete"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 4. UNIFIED ADD PRODUCT MODAL */}
          {isAddProductOpen && (
            <div className="admin-modal-backdrop" onClick={() => setIsAddProductOpen(false)}>
              <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-title">
                  <span>✨ Add New Product to Storefront</span>
                  <button
                    onClick={() => setIsAddProductOpen(false)}
                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleCreateFullProduct();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div className="admin-form-grid">
                    <div className="admin-form-group full-width">
                      <label>Product Title *</label>
                      <input
                        className="admin-input"
                        placeholder="e.g. Sony WH-1000XM5 Noise Canceling Headphones"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Category *</label>
                      <select
                        className="admin-input"
                        value={newCategoryId}
                        onChange={(e) => setNewCategoryId(e.target.value)}
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-form-group">
                      <label>SKU (Stock Keeping Unit)</label>
                      <input
                        className="admin-input"
                        placeholder="e.g. SONY-XM5-SLV"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Price in INR (₹) *</label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        className="admin-input"
                        value={newPriceRupees}
                        onChange={(e) => setNewPriceRupees(Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Initial Stock Count *</label>
                      <input
                        type="number"
                        min="0"
                        className="admin-input"
                        value={newStockCount}
                        onChange={(e) => setNewStockCount(Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Deal Badge</label>
                      <select
                        className="admin-input"
                        value={newBadge}
                        onChange={(e) => setNewBadge(e.target.value)}
                      >
                        <option value="GI Tagged Karnataka">GI Tagged Karnataka</option>
                        <option value="⚡ 15m Instant BLR">⚡ 15m Instant BLR</option>
                        <option value="Estate Fresh Coorg">Estate Fresh Coorg</option>
                        <option value="Palace Recipe">Palace Recipe</option>
                        <option value="Prime Assured">Prime Assured</option>
                        <option value="Best Seller">Best Seller</option>
                        <option value="Deal of the Day">Deal of the Day</option>
                        <option value="Trending BLR">Trending BLR</option>
                        <option value="New Arrival">New Arrival</option>
                      </select>
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Product Image URL *</label>
                      <input
                        type="url"
                        className="admin-input"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        required
                      />
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>Presets:</span>
                        {PRESET_IMAGES.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            className="admin-btn-secondary"
                            style={{ padding: "2px 6px", fontSize: "11px", color: "#1e293b", borderColor: "#cbd5e1" }}
                            onClick={() => setNewImageUrl(preset.url)}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="admin-form-group full-width">
                      <label>Image Preview</label>
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        style={{ height: "120px", width: "120px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Description</label>
                      <textarea
                        className="admin-input"
                        style={{ height: "70px", padding: "8px 12px" }}
                        placeholder="Detailed technical features, warranty, and specs..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ color: "#334155", borderColor: "#cbd5e1" }}
                      onClick={() => setIsAddProductOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn-primary" disabled={loading}>
                      {loading ? "Publishing..." : "Publish Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5. ADD CATEGORY MODAL */}
          {isAddCategoryOpen && (
            <div className="admin-modal-backdrop" onClick={() => setIsAddCategoryOpen(false)}>
              <div className="admin-modal-dialog" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-title">
                  <span>📁 Create New Category</span>
                  <button
                    onClick={() => setIsAddCategoryOpen(false)}
                    style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleCreateCategory();
                  }}
                  style={{ display: "flex", flexDirection: "column", gap: "14px" }}
                >
                  <div className="admin-form-group">
                    <label>Category Name *</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Home & Kitchen"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Description</label>
                    <input
                      className="admin-input"
                      placeholder="e.g. Cookware, furniture, and appliances"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ color: "#334155", borderColor: "#cbd5e1" }}
                      onClick={() => setIsAddCategoryOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn-primary" disabled={loading}>
                      Create Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
