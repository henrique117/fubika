import cron from "node-cron";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import prisma from "../../utils/prisma";
import { logger } from "../../utils/logger";
import { env } from "../../config/env";
import {
    GAME_MODES,
    BACKUP_RETENTION_DAYS,
    RANK_HISTORY_RETENTION_DAYS,
    ONE_DAY_MS,
} from "../../config/constants";

const execPromise = promisify(exec);

const performBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFolder = path.join(process.cwd(), "backups");
    const fileName = `fubika_backup_${timestamp}.sql`;
    const filePath = path.join(backupFolder, fileName);

    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    logger.info(`[Cron/Backup] Gerando backup diário: ${fileName}...`);

    const { host, user, password, name } = env.db;

    try {
        const command = `mysqldump -h ${host} -u ${user} -p'${password}' --no-tablespaces ${name} > ${filePath}`;
        await execPromise(command);
        logger.info("[Cron/Backup] Backup concluído com sucesso.");

        const files = fs.readdirSync(backupFolder);
        const now = Date.now();
        const retentionMs = BACKUP_RETENTION_DAYS * ONE_DAY_MS;

        for (const file of files) {
            const fPath = path.join(backupFolder, file);
            const stats = fs.statSync(fPath);
            if (now - stats.mtimeMs > retentionMs) {
                fs.unlinkSync(fPath);
                logger.info(`[Cron/Backup] Backup antigo removido: ${file}`);
            }
        }
    } catch (err) {
        logger.error({ err }, "[Cron/Backup Error] Falha ao gerar backup");
    }
};

const captureRankSnapshot = async () => {
    logger.info("[Cron/History] Verificando mudanças nos rankings...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const mode of GAME_MODES) {
        const leaderboard = await prisma.stats.findMany({
            where: { mode, pp: { gt: 0 } },
            orderBy: { pp: "desc" },
            select: { id: true, pp: true },
        });

        const changedEntries = [];

        for (const [index, stat] of leaderboard.entries()) {
            const currentRank = index + 1;
            const currentPP = stat.pp;

            const lastEntry = await prisma.user_rank_history.findFirst({
                where: { user_id: stat.id, mode: mode },
                orderBy: { date: "desc" },
            });

            if (!lastEntry || lastEntry.rank !== currentRank || lastEntry.pp !== currentPP) {
                changedEntries.push({
                    user_id: stat.id,
                    mode: mode,
                    pp: currentPP,
                    rank: currentRank,
                    date: today,
                });
            }
        }

        if (changedEntries.length > 0) {
            await prisma.user_rank_history.createMany({
                data: changedEntries,
                skipDuplicates: true,
            });
            logger.info(`[Cron/History] Modo ${mode}: ${changedEntries.length} atualizações salvas.`);
        }
    }
};

const cleanOldHistory = async () => {
    const retentionLimit = new Date();
    retentionLimit.setDate(retentionLimit.getDate() - RANK_HISTORY_RETENTION_DAYS);

    try {
        const deleted = await prisma.user_rank_history.deleteMany({
            where: {
                date: { lt: retentionLimit },
            },
        });
        if (deleted.count > 0) {
            logger.info(`[Cron/Clean] ${deleted.count} registros de histórico antigos foram removidos.`);
        }
    } catch (err) {
        logger.error({ err }, "[Cron/Clean Error] Falha ao limpar histórico antigo");
    }
};

export const initCronJobs = () => {
    cron.schedule(
        "0 0 * * *",
        async () => {
            logger.info("🕒 [Cron] Iniciando rotina de manutenção (00:00 BRT)...");

            try {
                await performBackup();
                await captureRankSnapshot();
                await cleanOldHistory();

                logger.info("✅ [Cron] Manutenção diária finalizada com sucesso.");
            } catch (error) {
                logger.error({ err: error }, "❌ [Cron] Falha crítica na rotina de manutenção");
            }
        },
        {
            timezone: "America/Sao_Paulo",
        }
    );

    logger.info("✅ Cron de Manutenção ativado (Backup 7d + Rank 60d + Snapshot Inteligente).");
};
