import { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware";
import { handleRankingGlobalReq } from "./ranking.controller";
import { GetGlobalRankInput } from "./ranking.schema";

const rankingRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);

    server.get<{ Querystring: GetGlobalRankInput }>('/global', handleRankingGlobalReq);
}

export default rankingRoutes;