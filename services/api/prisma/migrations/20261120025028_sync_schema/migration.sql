-- AlterTable
ALTER TABLE `scores` ADD COLUMN `score_sr` FLOAT NOT NULL DEFAULT 0.000;

-- CreateTable
CREATE TABLE `api_beatmap_cache` (
    `map_id` INTEGER NOT NULL,
    `cover` VARCHAR(255) NULL,
    `thumbnail` VARCHAR(255) NULL,
    `tags` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`map_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `api_beatmap_cache` ADD CONSTRAINT `api_beatmap_cache_map_id_fkey` FOREIGN KEY (`map_id`) REFERENCES `maps`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
