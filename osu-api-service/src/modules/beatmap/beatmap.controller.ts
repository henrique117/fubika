import { FastifyRequest, FastifyReply } from "fastify";
import { getBeatmap, getBeatmapset } from "./beatmap.service";
import { SearchBeatmaps } from "./beatmap.schema";

const parseInput = (params: SearchBeatmaps) => {
    return {
        ...params,
        id: Number(params.id)
    };
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
        console.error("Erro no controller de Beatmap:", error);

        if (error.response?.status === 404 || error.message?.includes("não encontrado")) {
            return res.status(404).send({ 
                error: "Not Found", 
                message: "O beatmap solicitado não foi encontrado." 
            });
        }

        return res.status(500).send({ 
            error: "Internal Server Error", 
            message: "Erro interno ao buscar beatmap." 
        });
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
        console.error("Erro no controller de Beatmapset:", error);

        if (error.response?.status === 404 || error.message?.includes("não encontrado")) {
            return res.status(404).send({ 
                error: "Not Found", 
                message: "O beatmapset solicitado não foi encontrado." 
            });
        }

        return res.status(500).send({ 
            error: "Internal Server Error", 
            message: "Erro interno ao buscar beatmapset." 
        });
    }
}