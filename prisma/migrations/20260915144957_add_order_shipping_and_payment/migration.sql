-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "shipping_address" JSONB;
