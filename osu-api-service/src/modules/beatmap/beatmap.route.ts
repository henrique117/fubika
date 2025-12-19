import { FastifyInstance } from "fastify";
import { handleBeatmapReq, handleBeatmapsetReq } from "./beatmap.controller";
import { authenticate } from "../../middlewares/auth.middleware";

interface BeatmapProps {
    id: number;
}

const beatmapRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);
    
    server.get<{ Params: BeatmapProps }>('/:id', handleBeatmapReq);
    server.get<{ Params: BeatmapProps }>('/c/:id', handleBeatmapsetReq);
}

export default beatmapRoutes;