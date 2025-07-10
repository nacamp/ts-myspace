/*
  Warnings:

  - The primary key for the `DepositProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `DepositProduct` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DepositProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "interest" REAL NOT NULL,
    "useInterest" BOOLEAN NOT NULL DEFAULT true,
    "initialDeposit" INTEGER,
    "monthlyDeposit" INTEGER,
    "totalDeposited" INTEGER,
    "totalInstallments" INTEGER,
    "paidInstallments" INTEGER,
    "maturityAt" DATETIME,
    "isMatured" BOOLEAN NOT NULL DEFAULT false,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DepositProduct" ("category", "createdAt", "id", "interest", "isMatured", "maturityAt", "name", "userName") SELECT "category", "createdAt", "id", "interest", "isMatured", "maturityAt", "name", "userName" FROM "DepositProduct";
DROP TABLE "DepositProduct";
ALTER TABLE "new_DepositProduct" RENAME TO "DepositProduct";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
