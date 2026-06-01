import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import prisma from '../../utils/prisma';

const execPromise = promisify(exec);

const performBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(process.cwd(), 'backups');
    const fileName = `fubika_backup_${timestamp}.sql`;
    const filePath = path.join(backupFolder, fileName);

    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    console.log(`[Cron/Backup] Gerando backup diário: ${fileName}...`);

    const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

    try {
        const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p'${DB_PASS}' --no-tablespaces ${DB_NAME} > ${filePath}`;
        await execPromise(command);
        console.log(`[Cron/Backup] Backup concluído com sucesso.`);

        const files = fs.readdirSync(backupFolder);
        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const fPath = path.join(backupFolder, file);
            const stats = fs.statSync(fPath);
            if (now - stats.mtimeMs > sevenDaysMs) {
                fs.unlinkSync(fPath);
                console.log(`[Cron/Backup] Backup antigo removido: ${file}`);
            }
        }
    } catch (err) {
        console.error('[Cron/Backup Error] Falha ao gerar backup:', err);
    }
};

const captureRankSnapshot = async () => {
    console.log('[Cron/History] Verificando mudanças nos rankings...');
    
    const modes = [0, 1, 2, 3, 4, 5, 6, 8]; 
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const mode of modes) {
        const leaderboard = await prisma.stats.findMany({
            where: { mode, pp: { gt: 0 } },
            orderBy: { pp: 'desc' },
            select: { id: true, pp: true } 
        });

        const changedEntries = [];

        for (const [index, stat] of leaderboard.entries()) {
            const currentRank = index + 1;
            const currentPP = stat.pp;

            const lastEntry = await prisma.user_rank_history.findFirst({
                where: { user_id: stat.id, mode: mode },
                orderBy: { date: 'desc' }
            });

            if (!lastEntry || lastEntry.rank !== currentRank || lastEntry.pp !== currentPP) {
                changedEntries.push({
                    user_id: stat.id,
                    mode: mode,
                    pp: currentPP,
                    rank: currentRank,
                    date: today
                });
            }
        }

        if (changedEntries.length > 0) {
            await prisma.user_rank_history.createMany({
                data: changedEntries,
                skipDuplicates: true
            });
            console.log(`[Cron/History] Modo ${mode}: ${changedEntries.length} atualizações salvas.`);
        }
    }
};

const cleanOldHistory = async () => {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    try {
        const deleted = await prisma.user_rank_history.deleteMany({
            where: {
                date: { lt: sixtyDaysAgo }
            }
        });
        if (deleted.count > 0) {
            console.log(`[Cron/Clean] ${deleted.count} registros de histórico antigos foram removidos.`);
        }
    } catch (err) {
        console.error('[Cron/Clean Error] Falha ao limpar histórico antigo:', err);
    }
};

export const initCronJobs = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 [Cron] Iniciando rotina de manutenção (00:00 BRT)...');
        
        try {
            await performBackup();
            
            await captureRankSnapshot();
            
            await cleanOldHistory();

            console.log('✅ [Cron] Manutenção diária finalizada com sucesso.');
        } catch (error) {
            console.error('❌ [Cron] Falha crítica na rotina de manutenção:', error);
        }
        
    }, {
        timezone: "America/Sao_Paulo"
    });

    console.log('✅ Cron de Manutenção ativado (Backup 7d + Rank 60d + Snapshot Inteligente).');
};