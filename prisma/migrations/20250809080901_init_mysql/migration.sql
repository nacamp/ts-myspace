-- CreateTable
CREATE TABLE `Freqtrade` (
    `id` VARCHAR(191) NOT NULL,
    `strategy` VARCHAR(191) NULL,
    `exchange` VARCHAR(191) NOT NULL,
    `coin` VARCHAR(191) NOT NULL,
    `buyQty` DOUBLE NOT NULL,
    `sellQty` DOUBLE NOT NULL,
    `buyPrice` DOUBLE NOT NULL,
    `sellPrice` DOUBLE NOT NULL,
    `tradedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepositProduct` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `interest` DOUBLE NOT NULL,
    `useInterest` BOOLEAN NOT NULL DEFAULT true,
    `initialDeposit` INTEGER NULL,
    `monthlyDeposit` INTEGER NULL,
    `totalDeposited` INTEGER NULL,
    `totalInstallments` INTEGER NULL,
    `paidInstallments` INTEGER NULL,
    `maturityAt` DATETIME(3) NULL,
    `isMatured` BOOLEAN NOT NULL DEFAULT false,
    `profit` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DemandDepositTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `totalDeposited` INTEGER NOT NULL,
    `interest` DOUBLE NOT NULL,
    `useInterest` BOOLEAN NOT NULL DEFAULT true,
    `profit` INTEGER NOT NULL DEFAULT 0,
    `depositProductId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Decision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `why` VARCHAR(191) NOT NULL,
    `result` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Judgment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `decisionId` INTEGER NOT NULL,
    `verdict` VARCHAR(191) NOT NULL,
    `category` ENUM('FACT', 'RESOURCE', 'FORECAST', 'VALUE', 'STAKEHOLDER', 'ETC') NOT NULL,
    `weight` INTEGER NOT NULL,
    `why` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoinTimeline` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `coin` VARCHAR(191) NOT NULL,
    `yyyymmdd` VARCHAR(191) NOT NULL,
    `close` DOUBLE NOT NULL,
    `volume` DOUBLE NOT NULL,
    `rsi` DOUBLE NOT NULL,
    `ema15` DOUBLE NOT NULL,
    `ema50` DOUBLE NOT NULL,
    `ema100` DOUBLE NOT NULL,
    `cross15` BOOLEAN NOT NULL,
    `cross50` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DemandDepositTransaction` ADD CONSTRAINT `DemandDepositTransaction_depositProductId_fkey` FOREIGN KEY (`depositProductId`) REFERENCES `DepositProduct`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Judgment` ADD CONSTRAINT `Judgment_decisionId_fkey` FOREIGN KEY (`decisionId`) REFERENCES `Decision`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
