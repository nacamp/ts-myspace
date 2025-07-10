-- CreateTable
CREATE TABLE "DepositProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "interest" REAL NOT NULL,
    "maturityAt" DATETIME,
    "isMatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
