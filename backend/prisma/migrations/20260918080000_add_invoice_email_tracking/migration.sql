ALTER TABLE "Invoice"
ADD COLUMN "emailTrackingToken" TEXT;

ALTER TABLE "Invoice"
ADD COLUMN "emailOpenedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Invoice_emailTrackingToken_key"
ON "Invoice" ("emailTrackingToken");
