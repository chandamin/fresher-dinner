/*
  Warnings:

  - Added the required column `persons` to the `SavedCollection` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "collectionTitle" TEXT,
    "products" JSONB,
    "persons" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedCollection_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SavedCollection" ("collectionId", "collectionTitle", "createdAt", "customerId", "id", "products") SELECT "collectionId", "collectionTitle", "createdAt", "customerId", "id", "products" FROM "SavedCollection";
DROP TABLE "SavedCollection";
ALTER TABLE "new_SavedCollection" RENAME TO "SavedCollection";
CREATE UNIQUE INDEX "SavedCollection_customerId_collectionId_key" ON "SavedCollection"("customerId", "collectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
