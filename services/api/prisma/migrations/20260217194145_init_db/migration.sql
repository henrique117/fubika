-- CreateTable
CREATE TABLE `user_rank_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `mode` TINYINT NOT NULL,
    `pp` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `rank` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `date` DATE NOT NULL,

    INDEX `user_rank_history_user_id_idx`(`user_id`),
    INDEX `user_rank_history_date_idx`(`date`),
    UNIQUE INDEX `user_rank_history_user_id_mode_date_key`(`user_id`, `mode`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `osu_id` INTEGER NOT NULL,
    `discord_id` VARCHAR(30) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_codes_osu_id_idx`(`osu_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `key` CHAR(64) NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `can_write` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `api_keys_key_key`(`key`),
    INDEX `api_keys_owner_id_idx`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by_id` INTEGER NOT NULL,
    `used_by_id` INTEGER NULL,

    UNIQUE INDEX `invites_code_key`(`code`),
    UNIQUE INDEX `invites_used_by_id_key`(`used_by_id`),
    INDEX `invites_created_by_id_idx`(`created_by_id`),
    INDEX `invites_used_by_id_idx`(`used_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL,
    `safe_name` VARCHAR(32) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `priv` INTEGER NOT NULL DEFAULT 1,
    `pw_bcrypt` CHAR(60) NOT NULL,
    `country` CHAR(2) NOT NULL DEFAULT 'xx',
    `silence_end` INTEGER NOT NULL DEFAULT 0,
    `donor_end` INTEGER NOT NULL DEFAULT 0,
    `creation_time` INTEGER NOT NULL DEFAULT 0,
    `latest_activity` INTEGER NOT NULL DEFAULT 0,
    `clan_id` INTEGER NOT NULL DEFAULT 0,
    `clan_priv` TINYINT NOT NULL DEFAULT 0,
    `preferred_mode` INTEGER NOT NULL DEFAULT 0,
    `play_style` INTEGER NOT NULL DEFAULT 0,
    `custom_badge_name` VARCHAR(16) NULL,
    `custom_badge_icon` VARCHAR(64) NULL,
    `userpage_content` VARCHAR(2048) NULL,
    `api_key` CHAR(36) NULL,
    `is_dev` BOOLEAN NOT NULL DEFAULT false,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `discord_id` VARCHAR(191) NULL,

    UNIQUE INDEX `users_name_key`(`name`),
    UNIQUE INDEX `users_safe_name_key`(`safe_name`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_api_key_key`(`api_key`),
    UNIQUE INDEX `users_discord_id_key`(`discord_id`),
    INDEX `users_priv_idx`(`priv`),
    INDEX `users_clan_id_idx`(`clan_id`),
    INDEX `users_clan_priv_idx`(`clan_priv`),
    INDEX `users_country_idx`(`country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stats` (
    `id` INTEGER NOT NULL,
    `mode` TINYINT NOT NULL,
    `tscore` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `rscore` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `pp` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `plays` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `playtime` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `acc` FLOAT NOT NULL DEFAULT 0.000,
    `max_combo` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `total_hits` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `replay_views` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `xh_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `x_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sh_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `s_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `a_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `stats_mode_idx`(`mode`),
    INDEX `stats_pp_idx`(`pp`),
    INDEX `stats_tscore_idx`(`tscore`),
    INDEX `stats_rscore_idx`(`rscore`),
    PRIMARY KEY (`id`, `mode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `map_md5` CHAR(32) NOT NULL,
    `score` INTEGER NOT NULL,
    `pp` FLOAT NOT NULL,
    `acc` FLOAT NOT NULL,
    `max_combo` INTEGER NOT NULL,
    `mods` INTEGER NOT NULL,
    `n300` INTEGER NOT NULL,
    `n100` INTEGER NOT NULL,
    `n50` INTEGER NOT NULL,
    `nmiss` INTEGER NOT NULL,
    `ngeki` INTEGER NOT NULL,
    `nkatu` INTEGER NOT NULL,
    `grade` VARCHAR(2) NOT NULL DEFAULT 'N',
    `status` TINYINT NOT NULL,
    `mode` TINYINT NOT NULL,
    `play_time` DATETIME(0) NOT NULL,
    `time_elapsed` INTEGER NOT NULL,
    `client_flags` INTEGER NOT NULL,
    `userid` INTEGER NOT NULL,
    `perfect` BOOLEAN NOT NULL,
    `online_checksum` CHAR(32) NOT NULL,

    INDEX `scores_map_md5_status_mode_idx`(`map_md5`, `status`, `mode`),
    INDEX `scores_map_md5_idx`(`map_md5`),
    INDEX `scores_mode_idx`(`mode`),
    INDEX `scores_mods_idx`(`mods`),
    INDEX `scores_online_checksum_idx`(`online_checksum`),
    INDEX `scores_play_time_idx`(`play_time`),
    INDEX `scores_pp_idx`(`pp`),
    INDEX `scores_score_idx`(`score`),
    INDEX `scores_status_idx`(`status`),
    INDEX `scores_userid_idx`(`userid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_hashes` (
    `userid` INTEGER NOT NULL,
    `osupath` CHAR(32) NOT NULL,
    `adapters` CHAR(32) NOT NULL,
    `uninstall_id` CHAR(32) NOT NULL,
    `disk_serial` CHAR(32) NOT NULL,
    `latest_time` DATETIME(0) NOT NULL,
    `occurrences` INTEGER NOT NULL DEFAULT 0,

    INDEX `client_hashes_userid_idx`(`userid`),
    PRIMARY KEY (`userid`, `osupath`, `adapters`, `uninstall_id`, `disk_serial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achievements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `file` VARCHAR(128) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `desc` VARCHAR(256) NOT NULL,
    `cond` VARCHAR(64) NOT NULL,

    UNIQUE INDEX `achievements_file_key`(`file`),
    UNIQUE INDEX `achievements_name_key`(`name`),
    UNIQUE INDEX `achievements_desc_key`(`desc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_achievements` (
    `userid` INTEGER NOT NULL,
    `achid` INTEGER NOT NULL,

    INDEX `user_achievements_achid_idx`(`achid`),
    INDEX `user_achievements_userid_idx`(`userid`),
    PRIMARY KEY (`userid`, `achid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL,
    `topic` VARCHAR(256) NOT NULL,
    `read_priv` INTEGER NOT NULL DEFAULT 1,
    `write_priv` INTEGER NOT NULL DEFAULT 2,
    `auto_join` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `channels_name_key`(`name`),
    INDEX `channels_auto_join_idx`(`auto_join`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(16) NOT NULL,
    `tag` VARCHAR(6) NOT NULL,
    `owner` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `clans_name_key`(`name`),
    UNIQUE INDEX `clans_tag_key`(`tag`),
    UNIQUE INDEX `clans_owner_key`(`owner`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maps` (
    `server` ENUM('osu!', 'private') NOT NULL DEFAULT 'osu!',
    `id` INTEGER NOT NULL,
    `set_id` INTEGER NOT NULL,
    `status` INTEGER NOT NULL,
    `md5` CHAR(32) NOT NULL,
    `artist` VARCHAR(128) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `version` VARCHAR(128) NOT NULL,
    `creator` VARCHAR(19) NOT NULL,
    `filename` VARCHAR(256) NOT NULL,
    `last_update` DATETIME(0) NOT NULL,
    `total_length` INTEGER NOT NULL,
    `max_combo` INTEGER NOT NULL,
    `frozen` BOOLEAN NOT NULL DEFAULT false,
    `plays` INTEGER NOT NULL DEFAULT 0,
    `passes` INTEGER NOT NULL DEFAULT 0,
    `mode` TINYINT NOT NULL DEFAULT 0,
    `bpm` FLOAT NOT NULL DEFAULT 0.00,
    `cs` FLOAT NOT NULL DEFAULT 0.00,
    `ar` FLOAT NOT NULL DEFAULT 0.00,
    `od` FLOAT NOT NULL DEFAULT 0.00,
    `hp` FLOAT NOT NULL DEFAULT 0.00,
    `diff` FLOAT NOT NULL DEFAULT 0.000,

    UNIQUE INDEX `maps_id_key`(`id`),
    UNIQUE INDEX `maps_md5_key`(`md5`),
    INDEX `maps_set_id_idx`(`set_id`),
    INDEX `maps_status_idx`(`status`),
    INDEX `maps_filename_idx`(`filename`),
    INDEX `maps_plays_idx`(`plays`),
    INDEX `maps_mode_idx`(`mode`),
    INDEX `maps_frozen_idx`(`frozen`),
    PRIMARY KEY (`server`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mapsets` (
    `server` ENUM('osu!', 'private') NOT NULL DEFAULT 'osu!',
    `id` INTEGER NOT NULL,
    `last_osuapi_check` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `mapsets_id_key`(`id`),
    PRIMARY KEY (`server`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `map_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `map_id` INTEGER NOT NULL,
    `player_id` INTEGER NOT NULL,
    `datetime` DATETIME(0) NOT NULL,
    `active` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `target_id` INTEGER NOT NULL,
    `target_type` ENUM('replay', 'map', 'song') NOT NULL,
    `userid` INTEGER NOT NULL,
    `time` INTEGER NOT NULL,
    `comment` VARCHAR(80) NOT NULL,
    `colour` CHAR(6) NULL,

    INDEX `comments_userid_idx`(`userid`),
    INDEX `comments_target_id_idx`(`target_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favourites` (
    `userid` INTEGER NOT NULL,
    `setid` INTEGER NOT NULL,
    `created_at` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`userid`, `setid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingame_logins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userid` INTEGER NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `osu_ver` DATE NOT NULL,
    `osu_stream` VARCHAR(11) NOT NULL,
    `datetime` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relationships` (
    `user1` INTEGER NOT NULL,
    `user2` INTEGER NOT NULL,
    `type` ENUM('friend', 'block') NOT NULL,

    INDEX `relationships_user1_idx`(`user1`),
    INDEX `relationships_user2_idx`(`user2`),
    PRIMARY KEY (`user1`, `user2`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from` INTEGER NOT NULL,
    `to` INTEGER NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `msg` VARCHAR(2048) NULL,
    `time` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `logs_from_idx`(`from`),
    INDEX `logs_to_idx`(`to`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_id` INTEGER NOT NULL,
    `to_id` INTEGER NOT NULL,
    `msg` VARCHAR(2048) NOT NULL,
    `time` INTEGER NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,

    INDEX `mail_from_id_idx`(`from_id`),
    INDEX `mail_to_id_idx`(`to_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ratings` (
    `userid` INTEGER NOT NULL,
    `map_md5` CHAR(32) NOT NULL,
    `rating` TINYINT NOT NULL,

    PRIMARY KEY (`userid`, `map_md5`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `performance_reports` (
    `scoreid` BIGINT UNSIGNED NOT NULL,
    `mod_mode` ENUM('vanilla', 'relax', 'autopilot') NOT NULL DEFAULT 'vanilla',
    `os` VARCHAR(64) NOT NULL,
    `fullscreen` BOOLEAN NOT NULL,
    `fps_cap` VARCHAR(16) NOT NULL,
    `compatibility` BOOLEAN NOT NULL,
    `version` VARCHAR(16) NOT NULL,
    `start_time` INTEGER NOT NULL,
    `end_time` INTEGER NOT NULL,
    `frame_count` INTEGER NOT NULL,
    `spike_frames` INTEGER NOT NULL,
    `aim_rate` INTEGER NOT NULL,
    `completion` BOOLEAN NOT NULL,
    `identifier` VARCHAR(128) NULL,
    `average_frametime` INTEGER NOT NULL,

    INDEX `performance_reports_scoreid_idx`(`scoreid`),
    PRIMARY KEY (`scoreid`, `mod_mode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `startups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ver_major` TINYINT NOT NULL,
    `ver_minor` TINYINT NOT NULL,
    `ver_micro` TINYINT NOT NULL,
    `datetime` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tourney_pool_maps` (
    `map_id` INTEGER NOT NULL,
    `pool_id` INTEGER NOT NULL,
    `mods` INTEGER NOT NULL,
    `slot` TINYINT NOT NULL,

    PRIMARY KEY (`map_id`, `pool_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tourney_pools` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(16) NOT NULL,
    `created_at` DATETIME(0) NOT NULL,
    `created_by` INTEGER NOT NULL,

    INDEX `tourney_pools_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_rank_history` ADD CONSTRAINT `user_rank_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verification_codes` ADD CONSTRAINT `verification_codes_osu_id_fkey` FOREIGN KEY (`osu_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invites` ADD CONSTRAINT `invites_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invites` ADD CONSTRAINT `invites_used_by_id_fkey` FOREIGN KEY (`used_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stats` ADD CONSTRAINT `stats_id_fkey` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scores` ADD CONSTRAINT `scores_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_hashes` ADD CONSTRAINT `client_hashes_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_achievements` ADD CONSTRAINT `user_achievements_achid_fkey` FOREIGN KEY (`achid`) REFERENCES `achievements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_userid_fkey` FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_user1_fkey` FOREIGN KEY (`user1`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_user2_fkey` FOREIGN KEY (`user2`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_from_fkey` FOREIGN KEY (`from`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_to_fkey` FOREIGN KEY (`to`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mail` ADD CONSTRAINT `mail_from_id_fkey` FOREIGN KEY (`from_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mail` ADD CONSTRAINT `mail_to_id_fkey` FOREIGN KEY (`to_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reports` ADD CONSTRAINT `performance_reports_scoreid_fkey` FOREIGN KEY (`scoreid`) REFERENCES `scores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
