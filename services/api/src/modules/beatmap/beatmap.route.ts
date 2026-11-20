import { FastifyInstance } from "fastify";
import { handleBeatmapReq, handleBeatmapsetReq } from "./beatmap.controller";
import { searchBeatmapsSchema } from "./beatmap.schema";

const beatmapRoutes = async (server: FastifyInstance) => {
    server.get('/:id', {
        schema: { params: searchBeatmapsSchema }
    }, handleBeatmapReq);

    server.get('/c/:id', {
        schema: { params: searchBeatmapsSchema }
    }, handleBeatmapsetReq);
}

export default beatmapRoutes;