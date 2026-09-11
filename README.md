# Scalable E-Commerce & Food Delivery Platform

A production-grade, microservices-inspired e-commerce and food delivery platform featuring an **Amazon / Flipkart-style modern Next.js storefront**, an **Express.js API Gateway**, **PostgreSQL with Prisma ORM**, **Redis distributed locking & rate limiting**, **RabbitMQ event-driven messaging**, and background worker pipelines.

> 🎓 **Preparing for Placements or Interviews?**
> Check out the complete [Interview & Placement Preparation Guide](docs/INTERVIEW_GUIDE.md) containing ATS-optimized resume bullet points, system architecture diagrams, and the Top 10 Technical Interview Questions & Model Answers.

## Key Highlights & Capabilities

### Amazon / Flipkart Storefront (`apps/web`) — Karnataka & Indian Localization
- **Modern E-Commerce Header:** Top dark nav bar with department selector, search bar with category filters, delivery pin-code locator tailored to Karnataka (`Indiranagar, Bengaluru - 560038`, Mysuru, Hubballi, Mangaluru), Account & Lists modal, and live cart item counter badge.
- **Hero Promotional Banner:** Namma Karnataka Mega Utsav Deals (`NAMMAKARNATAKA` coupon for 25% off) with deal tiles and quick highlights.
- **Rich Catalog with Authentic Karnataka Specialties:**
  - **Karnataka Handlooms & Fashion:** GI-Tagged Traditional Mysore Pure Silk Saree with Gold Zari Border, Bengaluru Streetwear Heavyweight Hoodies, Nike Running Shoes.
  - **Namma Food & Groceries (15m Delivery):** Namma Bengaluru Crispy Masala Dosa & Filter Kaapi Combo, Coorg Pure Arabica Coffee Beans, Traditional Ghee Mysore Pak Sweet Box, Royal Dum Biryani.
  - **Electronics & Mobiles:** Apple MacBook Pro 14" M3 Max, Apple iPhone 16 Pro Max, Sony WH-1000XM5, Samsung Galaxy S24 Ultra.
- **Authentic Indian Rupee (`₹`) Pricing:** Formatted in the Indian numbering system (`en-IN`: `₹1,49,900`, `₹12,999`, `₹499`, etc.) stored accurately in paise.
- **Amazon-Grade Product Cards:** High-resolution product images, star ratings with review counts, discount percentage tags, Prime Assured badges, stock urgency warnings, and 1-click "Buy Now".
- **Interactive Slide-Over Cart Drawer:** Side-cart with quantity increment/decrement steppers, coupon engine (`NAMMAKARNATAKA`, `BENGALURU50`, `KAVERI20`, `FLIPKART50`, `AMAZON20`), delivery fee calculations (FREE over ₹499, standard ₹40), and bill breakdown.
- **Seamless Checkout Modal:** Pre-filled Karnataka shipping addresses (Indiranagar, Bengaluru) and Indian payment selectors (Instant UPI / QR via PhonePe, Google Pay, Paytm, BHIM; RuPay / Debit / Credit Cards; Cash on Delivery).
- **Live Order Tracking Timeline:** Visual stepper (`Order Placed` $\rightarrow$ `Processing` $\rightarrow$ `Dispatched` $\rightarrow$ `Delivered`) with real-time order cancellation that restores inventory stock atomically.
- **Dual-Mode Architecture:** Communicates with the live Express backend (port 4000) or runs in In-Memory Demo Mode with an instant header toggle—ensuring zero downtime during live portfolio demos.

### Scalable Backend & Event Architecture (`apps/api`)
- **API Gateway Pattern:** Centralized request routing, JWT token generation & verification (15m access token, 7d refresh token), role-based authorization (`ADMIN` / `CUSTOMER`), and uniform envelope responses.
- **Redis Sliding-Window Rate Limiter:** Protects endpoints against DDoS and brute-force attacks (100 req/min per IP).
- **Redis Distributed Locking:** Prevents flash-sale overselling and inventory race conditions using `SET NX PX` with atomic Lua release scripts.
- **ACID Transaction Isolation:** PostgreSQL interactive transactions executed at `SERIALIZABLE` level to ensure order creation and inventory decrement happen atomically.
- **RabbitMQ Event-Driven Decoupling:** Emits domain events (`order.created`, `order.cancelled`) onto the `ecommerce.events` topic exchange, consumed by independent notification and inventory workers.
- **BullMQ Order Queue:** Background payment verification and fulfillment queue backed by Redis with exponential backoff retries.

## Architecture

```text
Browser Client
   |
   | HTTP / JSON (Port 3000)
   v
apps/web (Amazon / Flipkart Next.js Storefront)
   |
   | NEXT_PUBLIC_API_BASE_URL (Port 4000)
   v
apps/api (Express API Gateway)
   |
   +---> Redis (Port 6379) ---------------- Distributed Locks & Rate Limiting
   |
   +---> PostgreSQL (Port 5432) ----------- Relational ACID Persistence
   |
   +---> RabbitMQ (Port 5672 / 15672) ----- Inter-Service Topic Exchange (ecommerce.events)
   |
   +---> BullMQ Worker (orderWorker.ts) --- Asynchronous Payment & Job Queue
```


The API is the source of truth for authentication, catalog data, carts, orders, inventory, and payments. The browser stores the returned session in `localStorage` and sends the access token as a Bearer token.

## Repository Structure

```text
apps/
	api/
		prisma/seed.ts             Local users and catalog seed data
		src/
			controllers/             HTTP request handlers
			services/                Business logic
			repositories/            Prisma data access
			routes/                  API route registration
			middleware/              Auth, authorization, validation, logging, errors
			workers/                 BullMQ order worker
	web/
		src/app/page.tsx           Customer storefront route `/`
		src/app/shop-page.tsx      Storefront UI and customer workflows
		src/app/admin/page.tsx     Admin console route `/admin`
		src/app/admin/admin-page.tsx Admin UI and admin workflows
		src/lib/api.ts             Browser API client
packages/
	shared/                      Shared TypeScript types
prisma/
	schema.prisma                Database model source of truth
	migrations/                  Prisma migrations
docs/
	INTERVIEW_GUIDE.md           Interview prep, resume bullets, & system design Q&A
	API.md                       Expanded API reference
	OPERATIONS.md                Operations and payment notes
docker-compose.yml              PostgreSQL, Redis, RabbitMQ, and Adminer
docker-compose.app.yml         Containerized API and worker definition
```

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- Docker Desktop with the Linux engine enabled.
- PowerShell on Windows or a POSIX-compatible shell on macOS/Linux.

The repository currently uses Node.js 22 and npm 10 successfully.

## Local Development Setup

Run all commands from the repository root.

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Update the JWT secrets in `.env` to values with at least 32 characters. The local payment placeholders are sufficient when `PAYMENTS_FAKE_MODE=true`.

Important local values:

```env
DATABASE_URL=postgresql://ecommerce:ecommerce_password@localhost:5432/ecommerce_db?schema=public
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_DEMO_MODE=false
PAYMENTS_FAKE_MODE=true
```

`.env` is ignored by Git. Only `.env.example` is committed.

### 3. Start PostgreSQL, Redis, and Adminer

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

The services are:

| Service    | Address                 | Purpose                  |
| ---------- | ----------------------- | ------------------------ |
| PostgreSQL | `localhost:5432`        | Application database     |
| Redis      | `localhost:6379`        | Rate limiting and BullMQ |
| Adminer    | `http://localhost:8080` | Database browser         |

If Docker reports that it cannot connect to the Docker API or named pipe, start Docker Desktop and repeat the command.

### 4. Generate Prisma Client and prepare the database

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed is safe to rerun because it uses upserts. It creates two users, categories, products, and inventory items.

### 5. Start the development processes

You can launch both the **Express API Gateway** (port 4000) and the **Next.js Storefront** (port 3000) simultaneously with a single command from the repository root:

```bash
npm run dev
```

This runs both servers concurrently with color-coded terminal logs:
- `[api]` Express API Gateway & routes running at `http://localhost:4000`
- `[web]` Next.js Storefront & Admin Portal running at `http://localhost:3000`

#### Alternative: Running in separate terminals

If you prefer dedicated terminal windows for each process:

**Terminal 1 (Backend API):**
```bash
npm run dev:api
```

**Terminal 2 (Storefront & Admin):**
```bash
npm run dev:web
```

**Terminal 3 (Optional BullMQ Worker for background queues):**
```bash
npm run dev:worker -w apps/api
```

> [!TIP]
> **Troubleshooting: "Failed to connect" on `localhost:3000`**
> If your browser says "Failed to connect" or "This site can’t be reached":
> 1. Check if the web dev server is running. If you had an older `npm run dev` running in your terminal, press **`Ctrl + C`** to terminate it.
> 2. Run **`npm run dev`** again from the root folder. Both `[api]` and `[web]` should print startup messages.
> 3. Verify that your Docker containers are running: `docker compose ps` (Postgres, Redis, and RabbitMQ must be healthy).

---

## Local URLs

| Component | URL | Purpose |
| :--- | :--- | :--- |
| **Storefront (Customer)** | [`http://localhost:3000/`](http://localhost:3000/) | Amazon/Flipkart browsing, search, cart, checkout |
| **Seller Central (Admin)** | [`http://localhost:3000/admin`](http://localhost:3000/admin) | KPI metrics, catalog, order fulfillment, users |
| **API Health** | [`http://localhost:4000/health`](http://localhost:4000/health) | Backend health check (PostgreSQL + Redis status) |
| **API Base URL** | [`http://localhost:4000/api/v1`](http://localhost:4000/api/v1) | Express REST API endpoints |
| **Adminer Database GUI** | [`http://localhost:8080`](http://localhost:8080) | Web-based PostgreSQL database inspector |

---

## Step-by-Step Testing Guide (For Demos & Resumes)

Follow these scenarios to demonstrate the platform during portfolio presentations or technical interviews:

### Scenario 1: Customer Registration & Shopping
1. Open **`http://localhost:3000`** in your browser.
2. Click **Hello, Sign in** &rarr; **Create your account**.
3. Choose the **🛒 Customer** account toggle, enter your details (password min 8 characters), and click **Register Now**.
4. Browse products across Electronics, Mobiles, Fashion, and Food verticals. Use the search bar or category filters.
5. Sort products using the **Featured Deals**, **Price: Low to High**, or **Avg. Customer Review** dropdown.
6. Click **Add to Cart** or **Buy Now** on any product.
7. Open the cart drawer, apply coupon **`AMAZON20`** (20% off) or **`FLIPKART50`** (25% off), and click **Proceed to Checkout**.
8. Fill in shipping details and place the order.
9. Click **Returns & Orders** in the top navigation to view the live tracking timeline (**Order Placed** &rarr; **Processing / Paid**).

### Scenario 2: Admin Registration & Seller Central Management
1. Click **🛡️ Seller Central** in the top navigation bar (or visit **`http://localhost:3000/admin`**).
2. Switch to **Register New Admin** to create an admin account, or click **⚡ Quick Fill Seeded Admin** &rarr; **Sign In as Admin**.
3. Inspect the **5 KPI Metric Cards**: Total Revenue, Total Orders, Active SKUs, Low Stock Alerts, and Registered Users.
4. Go to **📦 Products & Inventory** and click **+ Add New Product**:
   - Fill in Title, Category, SKU, Price ($), Stock Count, select a preset photo or enter an image URL, and choose a Deal Badge.
   - Click **Publish Product**. Notice it appears immediately in the table and live on the storefront!
5. Test adjusting stock levels with the inline **`+10`** or **`-1`** buttons.
6. Go to **🛒 Orders & Fulfillment**:
   - Filter orders by `ALL`, `PENDING`, `PAID`, or `SHIPPED`.
   - Advance the customer's order from `PAID` to `SHIPPED` using the fulfillment dropdown.
7. Go to **👥 Users & Admins**:
   - View the live directory of registered customers and administrators with role badges and registration dates.

### Seed Accounts (Pre-configured)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `AdminPassword123!` |
| **Customer** | `customer@example.com` | `CustomerPassword123!` |

---

## API Overview

Base URL: `http://localhost:4000/api/v1`

Authentication uses:
```text
Authorization: Bearer <accessToken>
```

### Authentication
```text
POST   /auth/register    (accepts role: "CUSTOMER" | "ADMIN", min 8 char password)
POST   /auth/login
GET    /auth/me
POST   /auth/refresh
POST   /auth/logout
```

### User Management (Admin Only)
```text
GET    /users            (returns all registered customers and admins)
GET    /users/:id
```

### Public Catalog
```text
GET    /products
GET    /products/:slug
GET    /products/categories
```

### Customer Cart
```text
GET    /cart/me
POST   /cart/items
PATCH  /cart/items/:itemId
DELETE /cart/items/:itemId
DELETE /cart/items
```

### Customer Orders
```text
POST   /orders/checkout
GET    /orders/me
GET    /orders/me/:id
POST   /orders/me/:id/cancel
```

### Admin Order Operations
```text
GET    /orders/admin
GET    /orders/admin/:id
PATCH  /orders/admin/:id/status
```

### Payments
```text
POST   /payments/orders/:orderId/intent
POST   /payments/webhook
```

### Admin catalog and inventory

All endpoints in this section require an authenticated `ADMIN` user.

```text
GET    /catalog/admin/categories
POST   /catalog/admin/categories
PATCH  /catalog/admin/categories/:id
DELETE /catalog/admin/categories/:id

POST   /catalog/admin/products
PATCH  /catalog/admin/products/:id
DELETE /catalog/admin/products/:id

GET    /catalog/admin/products/:productId/inventory
POST   /catalog/admin/inventory
PATCH  /catalog/admin/inventory/:id
DELETE /catalog/admin/inventory/:id
```

Request examples and response details are in [docs/API.md](docs/API.md).

## Database Model

The Prisma schema in [prisma/schema.prisma](prisma/schema.prisma) defines:

- `User`: customer/admin identity and role.
- `Category`: catalog grouping with optional parent category.
- `Product`: catalog product belonging to a category.
- `InventoryItem`: SKU, price, stock, currency, and attributes.
- `Cart` and `CartItem`: active customer shopping cart.
- `Order` and `OrderItem`: immutable checkout snapshot and order status.
- `Transaction`: payment or refund state and provider identifiers.
- `PaymentLog`: provider webhook and idempotency audit data.

Money is stored as integer cents. Order statuses are `PENDING`, `PAID`, `SHIPPED`, `CANCELLED`, and `FAILED`.

## Testing and Validation

Run all workspace checks:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

Available workspace commands:

```bash
npm run typecheck -w apps/api
npm test -w apps/api
npm run test:watch -w apps/api
npm run lint -w apps/api
npm run typecheck -w apps/web
npm run lint -w apps/web
```

The API tests use Vitest. The current automated tests cover password behavior, request context, cart service behavior, and slug behavior. Full browser end-to-end tests are not currently included.

Basic smoke checks:

PowerShell:

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/api/v1/products
```

Expected health output reports both `database` and `redis` as `ok`.

## Prisma and Database Utilities

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

`npm run db:studio` opens Prisma Studio for inspecting the local database.

## Containerized Application Files

`docker-compose.yml` is the local infrastructure compose file. It starts PostgreSQL, Redis, and Adminer.

`docker-compose.app.yml` defines production-style API and order-worker containers. It expects the API image to be built from `apps/api/Dockerfile`, and it expects environment values such as JWT and payment secrets to be supplied. It does not define the Next.js web container; the web image is available separately through `apps/web/Dockerfile`.

The Dockerfiles use multi-stage Node.js 20 Alpine builds:

- API image: builds and runs `apps/api/dist/server.js` on port `4000`.
- Web image: builds Next.js standalone output and runs on port `3000`.

The local development workflow is recommended for development. Review [docs/OPERATIONS.md](docs/OPERATIONS.md) before deploying.

## Configuration Reference

The main environment variables are:

| Variable                   | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `NODE_ENV`                 | `development`, `test`, or `production`              |
| `PORT`                     | API port, normally `4000`                           |
| `DATABASE_URL`             | PostgreSQL connection string                        |
| `REDIS_URL`                | Redis connection string                             |
| `CORS_ORIGIN`              | Comma-separated allowed browser origins             |
| `JWT_ACCESS_SECRET`        | Access-token signing secret, minimum 32 characters  |
| `JWT_REFRESH_SECRET`       | Refresh-token signing secret, minimum 32 characters |
| `JWT_ACCESS_EXPIRES_IN`    | Access-token lifetime, normally `15m`               |
| `JWT_REFRESH_EXPIRES_IN`   | Refresh-token lifetime, normally `7d`               |
| `PAYMENTS_FAKE_MODE`       | Use local fake payment behavior when `true`         |
| `STRIPE_SECRET_KEY`        | Stripe server credential                            |
| `STRIPE_WEBHOOK_SECRET`    | Stripe webhook signing secret                       |
| `STRIPE_CURRENCY`          | Three-letter Stripe currency code                   |
| `RAZORPAY_KEY_ID`          | Razorpay server credential                          |
| `RAZORPAY_KEY_SECRET`      | Razorpay server credential                          |
| `RAZORPAY_WEBHOOK_SECRET`  | Razorpay webhook signing secret                     |
| `NEXT_PUBLIC_API_BASE_URL` | API URL used by the browser                         |
| `NEXT_PUBLIC_DEMO_MODE`    | Use frontend demo API behavior when `true`          |

## Current Limitations

- The frontend currently has only `/` and `/admin` routes.
- Cart, orders, and account workflows are embedded in the storefront rather than split into feature pages.
- The browser stores access and refresh tokens in `localStorage`; production applications should evaluate a more secure cookie-based session strategy.
- Payment provider credentials and signed webhook forwarding are required for real payment flows.
- The worker currently verifies queued order payment and logs the result. Email receipts, fulfillment synchronization, analytics, and fraud review are marked for future work.
- Product images are loaded from external Unsplash URLs in the current storefront UI.
- Automated browser end-to-end tests are not currently included.

## Additional Documentation

- [API reference](docs/API.md)
- [Operations guide](docs/OPERATIONS.md)
- [Prisma schema](prisma/schema.prisma)
