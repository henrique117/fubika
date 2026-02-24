import { FastifyInstance } from "fastify";
import { handleBeatmapReq, handleBeatmapsetReq } from "./beatmap.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { searchBeatmapsSchema } from "./beatmap.schema";

const beatmapRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);
    
    server.get('/:id', {
        schema: { params: searchBeatmapsSchema }
    }, handleBeatmapReq);

    server.get('/c/:id', {
        schema: { params: searchBeatmapsSchema }
    }, handleBeatmapsetReq);
}

export default beatmapRoutes;