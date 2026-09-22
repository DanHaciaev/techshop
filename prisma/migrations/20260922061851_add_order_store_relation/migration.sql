-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL DEFAULT '',
    "deliveryType" TEXT NOT NULL DEFAULT 'delivery',
    "address" TEXT NOT NULL DEFAULT '',
    "storeId" TEXT,
    "comment" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "total" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'online',
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "comment", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryType", "id", "paidAt", "paymentMethod", "source", "status", "storeId", "total", "updatedAt") SELECT "address", "comment", "createdAt", "customerEmail", "customerName", "customerPhone", "deliveryType", "id", "paidAt", "paymentMethod", "source", "status", "storeId", "total", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
