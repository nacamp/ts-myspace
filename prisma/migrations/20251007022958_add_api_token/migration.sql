-- CreateTable
CREATE TABLE `ApiToken` (
    `provider` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApiToken_expAt_idx`(`expAt`),
    PRIMARY KEY (`provider`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
