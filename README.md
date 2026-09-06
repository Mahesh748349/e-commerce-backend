# E-Commerce Platform

Production-ready monorepo foundation for an e-commerce backend and web application.

## Structure

- `apps/api`: Node.js, Express, TypeScript, Prisma, Redis
- `apps/web`: Next.js web application shell
- `packages/shared`: Shared TypeScript types and contracts
- `prisma/schema.prisma`: Database model source of truth
- `docker-compose.yml`: PostgreSQL, Redis, and Adminer for local development

## Local Setup

1. Copy `.env.example` to `.env`.
2. Run `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Generate Prisma Client with `npm run db:generate`.
5. Run migrations with `npm run db:migrate`.
6. Seed local data with `npm run db:seed`.
7. Start development with `npm run dev`.

## Seed Users

- Admin: `admin@example.com` / `AdminPassword123!`
- Customer: `customer@example.com` / `CustomerPassword123!`

## Core API Surface

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/cart/me`
- `POST /api/v1/cart/items`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/orders/me`
- `POST /api/v1/payments/webhook`
- `POST /api/v1/catalog/admin/products`
- `POST /api/v1/catalog/admin/categories`
- `POST /api/v1/catalog/admin/inventory`

## Documentation

- API reference: `docs/API.md`
- Operations guide: `docs/OPERATIONS.md`
