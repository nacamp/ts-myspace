-- CreateTable
CREATE TABLE "CoinTimeline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coin" TEXT NOT NULL,
    "yyyymmdd" TEXT NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "rsi" REAL NOT NULL,
    "ema15" REAL NOT NULL,
    "ema50" REAL NOT NULL,
    "ema100" REAL NOT NULL,
    "cross15" BOOLEAN NOT NULL,
    "cross50" BOOLEAN NOT NULL
);
