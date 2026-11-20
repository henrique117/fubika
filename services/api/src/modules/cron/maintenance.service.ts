import cron from "node-cron";
import prisma from "../../utils/prisma";
import { logger } from "../../utils/logger";
import { GAME_MODES, RANK_HISTORY_RETENTION_DAYS } from "../../config/constants";

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

    logger.info(
        `✅ Cron de Manutenção ativado (Rank ${RANK_HISTORY_RETENTION_DAYS}d + Snapshot Inteligente).`
    );
};
