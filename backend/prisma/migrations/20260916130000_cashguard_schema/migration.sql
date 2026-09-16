BEGIN;

-- ============================================================
-- 1. Add new enum values
-- ============================================================

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'USER';

ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'VIEWED';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID';
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'PaymentMethod'
    ) THEN
        CREATE TYPE "PaymentMethod" AS ENUM (
            'BANK_TRANSFER',
            'CARD',
            'UPI',
            'CASH',
            'OTHER'
        );
    END IF;
END $$;


-- ============================================================
-- 2. User
-- ============================================================

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "User"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
ALTER COLUMN "updatedAt" SET NOT NULL;


-- ============================================================
-- 3. Client
-- ============================================================

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "riskScore" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Client"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

ALTER TABLE "Client"
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Client"
ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Client_userId_idx"
ON "Client" ("userId");


-- ============================================================
-- 4. Invoice
-- ============================================================

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "invoiceNo" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "userId" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "tax" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "amount" DECIMAL(12,2);

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'INR';

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);


-- Populate userId from the invoice's client
UPDATE "Invoice" i
SET "userId" = c."userId"
FROM "Client" c
WHERE i."clientId" = c."id"
  AND i."userId" IS NULL;


-- Existing total becomes the initial subtotal/amount
UPDATE "Invoice"
SET "subtotal" = "total"
WHERE "subtotal" IS NULL;

UPDATE "Invoice"
SET "amount" = "total"
WHERE "amount" IS NULL;

UPDATE "Invoice"
SET "tax" = 0
WHERE "tax" IS NULL;

UPDATE "Invoice"
SET "currency" = 'INR'
WHERE "currency" IS NULL;

UPDATE "Invoice"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;


-- Generate invoice numbers for existing invoices
WITH numbered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
    FROM "Invoice"
    WHERE "invoiceNo" IS NULL
)
UPDATE "Invoice" i
SET "invoiceNo" = 'INV-' || LPAD(numbered.rn::TEXT, 4, '0')
FROM numbered
WHERE i."id" = numbered."id";


ALTER TABLE "Invoice"
ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Invoice"
ALTER COLUMN "invoiceNo" SET NOT NULL;

ALTER TABLE "Invoice"
ALTER COLUMN "subtotal" SET NOT NULL;

ALTER TABLE "Invoice"
ALTER COLUMN "amount" SET NOT NULL;

ALTER TABLE "Invoice"
ALTER COLUMN "currency" SET DEFAULT 'INR';

ALTER TABLE "Invoice"
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Invoice"
ALTER COLUMN "updatedAt" SET NOT NULL;


-- Unique invoice number
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key"
ON "Invoice" ("invoiceNo");

CREATE INDEX IF NOT EXISTS "Invoice_userId_idx"
ON "Invoice" ("userId");

CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx"
ON "Invoice" ("clientId");

CREATE INDEX IF NOT EXISTS "Invoice_status_idx"
ON "Invoice" ("status");


-- ============================================================
-- 5. InvoiceItem
-- ============================================================

ALTER TABLE "InvoiceItem"
ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION;

UPDATE "InvoiceItem"
SET "amount" = "quantity"::DOUBLE PRECISION * "unitPrice"::DOUBLE PRECISION
WHERE "amount" IS NULL;

ALTER TABLE "InvoiceItem"
ALTER COLUMN "quantity" TYPE DOUBLE PRECISION
USING "quantity"::DOUBLE PRECISION;

ALTER TABLE "InvoiceItem"
ALTER COLUMN "unitPrice" TYPE DOUBLE PRECISION
USING "unitPrice"::DOUBLE PRECISION;

ALTER TABLE "InvoiceItem"
ALTER COLUMN "amount" SET NOT NULL;


-- ============================================================
-- 6. Payment
-- ============================================================

ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "method" "PaymentMethod"
DEFAULT 'BANK_TRANSFER';

ALTER TABLE "Payment"
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3);

UPDATE "Payment"
SET "createdAt" = "paidAt"
WHERE "createdAt" IS NULL;

ALTER TABLE "Payment"
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Payment"
ALTER COLUMN "createdAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx"
ON "Payment" ("invoiceId");


-- ============================================================
-- 7. New foreign key: Invoice -> User
-- ============================================================

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;


COMMIT;