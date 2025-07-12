-- CreateTable
CREATE TABLE "DemandDepositTransaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "totalDeposited" INTEGER NOT NULL,
    "interest" REAL NOT NULL,
    "useInterest" BOOLEAN NOT NULL DEFAULT true,
    "profit" INTEGER NOT NULL DEFAULT 0,
    "depositProductId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DemandDepositTransaction_depositProductId_fkey" FOREIGN KEY ("depositProductId") REFERENCES "DepositProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
