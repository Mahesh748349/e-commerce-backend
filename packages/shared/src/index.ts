export type Role = "ADMIN" | "CUSTOMER";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "FAILED";

export type Money = {
  amountCents: number;
  currency: string;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  price: Money;
  stockCount: number;
};
