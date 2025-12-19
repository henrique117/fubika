import { FastifyReply, FastifyRequest } from "fastify";
import { getGlobalRankSchema } from "./ranking.schema";
import { getGlobalLeaderboard } from "./ranking.service";

export const handleRankingGlobalReq = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    try {
        const result = getGlobalRankSchema.safeParse(req.query);

        if (!result.success) {
            return res.code(400).send({ 
                error: "Parâmetros inválidos", 
                details: result.error.format() 
            });
        }

        const leaderboard = await getGlobalLeaderboard(result.data);

        return res.send(leaderboard);

    } catch (err) {
        return res.code(500).send({ error: "Erro interno ao buscar ranking." });
    }
}