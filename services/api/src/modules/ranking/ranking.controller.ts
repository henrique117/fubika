import { FastifyReply, FastifyRequest } from "fastify";
import { getGlobalRankSchema } from "./ranking.schema";
import { getGlobalLeaderboard } from "./ranking.service";

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[Ranking API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleRankingGlobalReq = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    try {
        const result = getGlobalRankSchema.safeParse(req.query);

        if (!result.success) {
            return sendError(res, 400, "Parâmetros de consulta inválidos.");
        }

        const leaderboard = await getGlobalLeaderboard(result.data);

        return res.send(leaderboard);

    } catch (err) {
        return sendError(res, 500, "Não foi possível carregar o ranking global.", err);
    }
}