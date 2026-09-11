# Cloud Deployment Guide: Render (Backend) + Netlify/Vercel (Frontend)

This guide walks you through deploying your full-stack E-Commerce & Food Delivery application to production on **Render** (API & PostgreSQL) and **Netlify / Vercel** (Next.js Storefront).

---

## 1. Deploying the Backend on Render

Render will host your Express API Gateway, managed PostgreSQL database, and Redis.

### Step 1: Push your code to GitHub
Ensure all your latest changes are pushed to your GitHub repository:
```powershell
git add .
git commit -m "feat: complete production ready e-commerce platform"
git push origin main
```

### Step 2: Create a Blueprint on Render
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Connect your GitHub repository `e-commerce-backend`.
4. Render will automatically detect [`render.yaml`](../render.yaml) and propose:
   - Web Service: `ecommerce-api`
   - Database: `ecommerce-postgres` (PostgreSQL 16)
5. Click **Apply**.
6. Render will automatically build the backend, run `prisma migrate deploy`, and start your API.
7. Once deployed, Render provides you with an API URL, for example:
   `https://ecommerce-api-xxxx.onrender.com`
8. Verify it by visiting: `https://ecommerce-api-xxxx.onrender.com/health` (returns `{"status":"ok"}`).

---

## 2. Deploying the Storefront on Netlify

### Step 1: Connect Netlify to GitHub
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** $\rightarrow$ **Import an existing project**.
3. Select **GitHub** and choose your repository.

### Step 2: Configure Build Settings
Netlify will read [`netlify.toml`](../netlify.toml) automatically:
- **Base directory**: `apps/web`
- **Build command**: `npm run build`
- **Publish directory**: `apps/web/.next`

### Step 3: Add Environment Variables in Netlify
Under **Site configuration** $\rightarrow$ **Environment variables**, add:
- `NEXT_PUBLIC_API_BASE_URL` = `https://ecommerce-api-xxxx.onrender.com` (your Render backend URL)
- `NEXT_PUBLIC_DEMO_MODE` = `false`

Click **Deploy Site**. Your Amazon / Flipkart storefront is now live worldwide!

---

## 3. Alternative: Deploying Storefront on Vercel

If you prefer Vercel:
1. Log in to [Vercel](https://vercel.com/) and click **Add New...** $\rightarrow$ **Project**.
2. Select your repository.
3. Set **Root Directory** to `apps/web`.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://ecommerce-api-xxxx.onrender.com`
   - `NEXT_PUBLIC_DEMO_MODE` = `false`
5. Click **Deploy**. Vercel will deploy your Next.js storefront in under 60 seconds.

---

## 4. Local Database Console (Adminer) Quick Guide

When running locally with `docker compose up -d`, Adminer is available on `http://localhost:8080`.

To connect to your local PostgreSQL database:
| Adminer Field | Value | Note |
| :--- | :--- | :--- |
| **System** | **PostgreSQL** | Select **PostgreSQL** from the dropdown (NOT MySQL!) |
| **Server** | **`postgres`** | Inside Docker network, the hostname is `postgres` |
| **Username** | **`ecommerce`** | Configured in `.env` |
| **Password** | **`ecommerce_password`** | Configured in `.env` |
| **Database** | **`ecommerce_db`** | Configured in `.env` |

Once logged in, you will see all live tables:
- `users`
- `categories`
- `products`
- `inventory_items`
- `carts` & `cart_items`
- `orders` & `order_items`
- `payments`
