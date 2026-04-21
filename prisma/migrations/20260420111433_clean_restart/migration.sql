/*
  Warnings:

  - You are about to drop the column `shopifyOrderId` on the `SellingPlanOrder` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SellingPlanOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "shopifyCustomerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pax" INTEGER NOT NULL DEFAULT 1,
    "sellingPlanId" TEXT NOT NULL,
    "sellingPlanName" TEXT,
    "totalValue" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellingPlanOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SellingPlanOrder" ("createdAt", "customerId", "id", "pax", "quantity", "sellingPlanId", "sellingPlanName", "shopifyCustomerId", "title", "totalValue") SELECT "createdAt", "customerId", "id", "pax", "quantity", "sellingPlanId", "sellingPlanName", "shopifyCustomerId", "title", "totalValue" FROM "SellingPlanOrder";
DROP TABLE "SellingPlanOrder";
ALTER TABLE "new_SellingPlanOrder" RENAME TO "SellingPlanOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
