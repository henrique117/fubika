import { FastifyInstance } from "fastify";
import { handleBeatmapReq, handleBeatmapsetReq } from "./beatmap.controller";

interface BeatmapProps {
    id: number;
}

const beatmapRoutes = async (server: FastifyInstance) => {
    server.get<{ Params: BeatmapProps }>('/:id', handleBeatmapReq);
    server.get<{ Params: BeatmapProps }>('/c/:id', handleBeatmapsetReq);
}

export default beatmapRoutes;