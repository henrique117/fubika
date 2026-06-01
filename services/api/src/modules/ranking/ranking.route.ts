import { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware";
import { handleRankingGlobalReq } from "./ranking.controller";
import { GetGlobalRankInput, getGlobalRankSchema } from "./ranking.schema";

const rankingRoutes = async (server: FastifyInstance) => {

    server.get<{ Querystring: GetGlobalRankInput }>('/global', {
        schema: {
            querystring: getGlobalRankSchema
        },
        preHandler: [authenticate]
    }, handleRankingGlobalReq);

}

export default rankingRoutes;