-- CreateTable
CREATE TABLE "Freqtrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exchange" TEXT NOT NULL,
    "coin" TEXT NOT NULL,
    "buyQty" REAL NOT NULL,
    "sellQty" REAL NOT NULL,
    "buyPrice" REAL NOT NULL,
    "sellPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
