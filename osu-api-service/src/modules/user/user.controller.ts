import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, getUserBestOnMap, getUserRecent, getUserStats, loginUser } from "./user.service";
import { CreateUserInput, GetUserInput, GetUserMapInput, LoginUserInput, ScoreQueryInput, ScoreQueryModeInput, scoreQueryModeSchema, scoreQuerySchema } from "./user.schema";
import z from "zod";

const toSafeName = (name: string) => name.trim().toLowerCase().replace(/ /g, '_');

export const handleUserLogin = async (req: FastifyRequest<{ Body: LoginUserInput }>, res: FastifyReply) => {
    try {
        const body = req.body;

        const user = await loginUser(body);

        const token = req.server.jwt.sign({
            id: user.id,
            name: user.name,
            priv: user.priv
        }, {
            expiresIn: '7d'
        });

        return res.send({ token });

    } catch (err: any) {
        return res.code(401).send({ message: err.message });
    }
}

export const handleUserRegister = async (
    req: FastifyRequest<{ Body: CreateUserInput }>,
    res: FastifyReply
) => {

    const body = req.body;

    try {
        const user = await createUser(body);

        return res.code(201).send(user);
    } catch (err) {
        return res.code(401).send(err);
    }
}

export const handleUserReq = async (
    req: FastifyRequest<{ Params: GetUserInput }>,
    res: FastifyReply
) => {
    try {
        const rawParam = req.params.id;

        let userResult;

        if (/^\d+$/.test(rawParam)) {
            if (rawParam.length > 15) {
                userResult = await getUserStats({ discord_id: rawParam });
            } else {
                userResult = await getUserStats({ id: Number(rawParam) });
            }
        }

        else {
            const safeName = toSafeName(rawParam);
            userResult = await getUserStats({ safe_name: safeName });
        }

        return res.code(200).send(userResult);

    } catch (err: any) {
        console.error("Erro ao buscar usuário:", err);

        if (err.message === "Usuário não encontrado" || err.message.includes("inválido")) {
            return res.code(404).send({ error: err.message });
        }

        return res.code(500).send({ error: "Erro interno ao buscar dados do usuário." });
    }
}

export const handleUserRecentReq = async (
    req: FastifyRequest<{ Params: GetUserInput, Querystring: ScoreQueryInput }>,
    res: FastifyReply
) => {
    try {
        const rawParam = req.params.id;
        const query = scoreQuerySchema.parse(req.query); 

        let userRecentScores;
        
        if (/^\d+$/.test(rawParam)) {
            if (rawParam.length > 15) {
                userRecentScores = await getUserRecent({ discord_id: rawParam }, query);
            } else {
                userRecentScores = await getUserRecent({ id: Number(rawParam) }, query);
            }
        } else {
            const safeName = toSafeName(rawParam);
            userRecentScores = await getUserRecent({ safe_name: safeName }, query);
        }

        return res.code(200).send(userRecentScores);

    } catch (err: any) {
        console.error("Erro ao buscar recent scores:", err);

        if (err.message === "Usuário não encontrado" || err.message.includes("inválido")) {
            return res.code(404).send({ error: err.message });
        }

        return res.code(500).send({ error: "Erro interno ao buscar scores recentes." });
    }
}

export const handleUserBestOnMapReq = async (
    req: FastifyRequest<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>,
    res: FastifyReply
) => {
    try {
        const rawParam = req.params.id;
        const bmapId = Number(req.params.map);

        const query = scoreQueryModeSchema.parse(req.query);

        let scoreResult;

        if (/^\d+$/.test(rawParam)) {
            if (rawParam.length > 15) {
                scoreResult = await getUserBestOnMap({ discord_id: rawParam }, bmapId, query);
            } else {
                scoreResult = await getUserBestOnMap({ id: Number(rawParam) }, bmapId, query);
            }
        } else {
            const safeName = toSafeName(rawParam);
            scoreResult = await getUserBestOnMap({ safe_name: safeName }, bmapId, query);
        }

        if (scoreResult === null || scoreResult === undefined) {
            return res.code(404).send({ message: "Nenhum score encontrado para este mapa." });
        }

        return res.code(200).send(scoreResult);

    } catch (err: any) {
        console.error("Erro ao buscar score:", err);

        if (err instanceof z.ZodError) {
             return res.code(400).send({ error: "Parâmetros inválidos", details: err.format() });
        }

        if (err.message === "Usuário não encontrado" || err.message.includes("inválido") || err.message === "Mapa não encontrado no banco de dados.") {
            return res.code(404).send({ error: err.message });
        }

        return res.code(500).send({ error: "Erro interno ao buscar score." });
    }
}