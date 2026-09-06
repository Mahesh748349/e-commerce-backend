# Operations Guide

## Local Development

1. Copy `.env.example` to `.env`.
2. Fill real `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values with at least 32 characters.
3. Start infrastructure:

```bash
docker compose up -d
```

4. Generate Prisma Client:

```bash
npm run db:generate
```

5. Apply migrations:

```bash
npm run db:migrate
```

6. Seed the database:

```bash
npm run db:seed
```

7. Start the API and web app:

```bash
npm run dev
```

8. Start the order worker in a separate terminal:

```bash
npm run dev:worker -w apps/api
```

## Validation

```bash
npm run typecheck
npm test
npm run build
```

## Local Services

- API: `http://localhost:4000`
- Web: `http://localhost:3000`
- Adminer: `http://localhost:8080`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Seed Credentials

- Admin: `admin@example.com` / `AdminPassword123!`
- Customer: `customer@example.com` / `CustomerPassword123!`

## Payment Webhooks

The webhook endpoint is:

```text
POST http://localhost:4000/api/v1/payments/webhook
```

Use provider CLI tools or dashboards to forward signed webhook events.

Stripe events should include metadata:

```json
{
  "orderId": "<order-id>",
  "idempotencyKey": "<payment-idempotency-key>"
}
```

Razorpay payment notes should include:

```json
{
  "orderId": "<order-id>",
  "idempotencyKey": "<payment-idempotency-key>"
}
```

## Production Notes

- Store secrets in a managed secret store, not `.env` files.
- Run API and worker as separate processes.
- Configure Redis persistence and eviction policy intentionally.
- Add database backups, migration review, and rollback procedures.
- Keep Stripe/Razorpay webhook secrets isolated by environment.
- Put the API behind TLS, a WAF or edge proxy, and centralized logging.
