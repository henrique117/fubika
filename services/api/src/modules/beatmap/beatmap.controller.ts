import { FastifyReply, FastifyRequest } from "fastify";
import { getBeatmap, getBeatmapset } from "./beatmap.service";
import { SearchBeatmaps } from "./beatmap.schema";

const parseInput = (params: SearchBeatmaps) => {
    return {
        ...params,
        id: Number(params.id)
    };
};

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[Beatmap API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleBeatmapReq = async (
    req: FastifyRequest<{ Params: SearchBeatmaps }>,
    res: FastifyReply
) => {
    try {
        const input = parseInput(req.params);
        const beatmap = await getBeatmap(input);
        return res.status(200).send(beatmap);
    } catch (error: any) {
        if (error.response?.status === 404 || error.message?.includes("não encontrado")) {
            return sendError(res, 404, "O beatmap solicitado não foi encontrado.");
        }
        return sendError(res, 500, "Erro ao processar a busca do beatmap.", error);
    }
}

export const handleBeatmapsetReq = async (
    req: FastifyRequest<{ Params: SearchBeatmaps }>,
    res: FastifyReply
) => {
    try {
        const input = parseInput(req.params);
        const beatmapset = await getBeatmapset(input);
        return res.status(200).send(beatmapset);
    } catch (error: any) {
        if (error.response?.status === 404 || error.message?.includes("não encontrado")) {
            return sendError(res, 404, "O beatmapset solicitado não foi encontrado.");
        }
        return sendError(res, 500, "Erro ao processar a busca do beatmapset.", error);
    }
}