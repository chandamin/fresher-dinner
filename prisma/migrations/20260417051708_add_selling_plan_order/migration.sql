-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "name" TEXT;

-- AlterTable
ALTER TABLE "SavedCollection" ADD COLUMN "collectionTitle" TEXT;

-- CreateTable
CREATE TABLE "SellingPlanOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "shopifyCustomerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellingPlanId" TEXT NOT NULL,
    "sellingPlanName" TEXT,
    "totalValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellingPlanOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
