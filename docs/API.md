# API Reference

Base URL: `http://localhost:4000/api/v1`

## Auth

### Register

`POST /auth/register`

```json
{
  "email": "customer@example.com",
  "password": "CustomerPassword123!",
  "firstName": "Customer",
  "lastName": "User"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "customer@example.com",
  "password": "CustomerPassword123!"
}
```

Use `data.tokens.accessToken` as:

```text
Authorization: Bearer <accessToken>
```

### Current User

`GET /auth/me`

Requires authentication.

### Refresh Session

`POST /auth/refresh`

```json
{
  "refreshToken": "<refreshToken>"
}
```

### Logout

`POST /auth/logout`

Requires authentication.

## Public Catalog

### List Products

`GET /products`

### Product Detail

`GET /products/:slug`

## Cart

All cart routes require authentication.

### Get Cart

`GET /cart/me`

### Add Item

`POST /cart/items`

```json
{
  "inventoryItemId": "00000000-0000-0000-0000-000000000000",
  "quantity": 1
}
```

### Update Item Quantity

`PATCH /cart/items/:itemId`

```json
{
  "quantity": 2
}
```

Set `quantity` to `0` to remove the item.

### Remove Item

`DELETE /cart/items/:itemId`

### Clear Cart

`DELETE /cart/items`

## Orders

### Checkout

`POST /orders/checkout`

Requires authentication.

```json
{
  "paymentProvider": "stripe",
  "idempotencyKey": "checkout-unique-key-001"
}
```

### My Orders

`GET /orders/me`

Requires authentication.

### My Order Detail

`GET /orders/me/:id`

Requires authentication.

### Cancel My Pending Order

`POST /orders/me/:id/cancel`

Requires authentication.

### Admin Order List

`GET /orders/admin?status=PENDING&page=1&pageSize=25`

Requires `ADMIN`.

### Admin Order Detail

`GET /orders/admin/:id`

Requires `ADMIN`.

### Admin Update Order Status

`PATCH /orders/admin/:id/status`

Requires `ADMIN`.

```json
{
  "status": "SHIPPED"
}
```

## Payments

### Create Payment Intent

`POST /payments/orders/:orderId/intent`

Requires authentication.

```json
{
  "provider": "stripe",
  "idempotencyKey": "payment-intent-unique-key-001"
}
```

Supported providers: `stripe`, `razorpay`.

### Payment Webhook

`POST /payments/webhook`

This route is mounted before JSON parsing so Stripe/Razorpay signatures can be verified against the raw request body.

## Admin Catalog

All admin catalog routes require `ADMIN`.

### Categories

`GET /catalog/admin/categories`

`POST /catalog/admin/categories`

```json
{
  "name": "Apparel",
  "description": "Everyday clothing"
}
```

`PATCH /catalog/admin/categories/:id`

`DELETE /catalog/admin/categories/:id`

### Products

`POST /catalog/admin/products`

```json
{
  "categoryId": "00000000-0000-0000-0000-000000000000",
  "name": "Premium Hoodie",
  "description": "Heavyweight cotton hoodie",
  "isActive": true
}
```

`PATCH /catalog/admin/products/:id`

`DELETE /catalog/admin/products/:id`

### Inventory

`GET /catalog/admin/products/:productId/inventory`

`POST /catalog/admin/inventory`

```json
{
  "productId": "00000000-0000-0000-0000-000000000000",
  "sku": "HOODIE-BLK-M",
  "stockCount": 25,
  "priceCents": 6999,
  "currency": "USD",
  "attributes": {
    "color": "Black",
    "size": "M"
  }
}
```

`PATCH /catalog/admin/inventory/:id`

`DELETE /catalog/admin/inventory/:id`
