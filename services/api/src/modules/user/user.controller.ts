import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, getUserBestOnMap, getUserRecent, getUsersCount, getUserStats, loginUser, setUserPfp } from "./user.service";
import { CreateUserInput, GetUserInput, GetUserMapInput, LoginUserInput, PostPfpInput, postPfpSchema, ScoreQueryInput, ScoreQueryModeInput, scoreQueryModeSchema, scoreQuerySchema } from "./user.schema";
import z from "zod";

const toSafeName = (name: string) => name.trim().toLowerCase().replace(/ /g, '_');

const sendError = (res: FastifyReply, statusCode: number, message: string, technicalError?: any) => {
    if (technicalError) {
        console.error(`[API Error ${statusCode}]:`, technicalError);
    }
    return res.code(statusCode).send({ 
        error: statusCode >= 500 ? "Internal Server Error" : "Bad Request",
        message 
    });
};

export const handleGetUsersCount = async (_: any, res: FastifyReply) => {
    try {
        const userCount = await getUsersCount();
        return res.send(userCount);
    } catch (err) {
        return sendError(res, 500, "Não foi possível carregar a contagem de jogadores.", err);
    }
}

export const handleUserLogin = async (req: FastifyRequest<{ Body: LoginUserInput }>, res: FastifyReply) => {
    try {
        const user = await loginUser(req.body);

        const token = req.server.jwt.sign({
            id: user.id,
            name: user.name
        }, {
            expiresIn: '7d'
        });

        return res.send({ token, user });
    } catch (err: any) {
        return sendError(res, 401, "Credenciais inválidas. Verifique seu e-mail e senha.", err);
    }
}

export const handleUserRegister = async (req: FastifyRequest<{ Body: CreateUserInput }>, res: FastifyReply) => {
    try {
        const user = await createUser(req.body);
        return res.code(201).send(user);
    } catch (err: any) {
        const msg = err.message || "Erro ao realizar o cadastro.";
        return sendError(res, 400, msg, err);
    }
}

export const handleUserReq = async (req: FastifyRequest<{ Params: GetUserInput }>, res: FastifyReply) => {
    try {
        const rawParam = req.params.id;
        let userResult;

        if (/^\d+$/.test(rawParam)) {
            if (rawParam.length > 15) {
                userResult = await getUserStats({ discord_id: rawParam });
            } else {
                userResult = await getUserStats({ id: Number(rawParam) });
            }
        } else {
            userResult = await getUserStats({ safe_name: toSafeName(rawParam) });
        }

        return res.code(200).send(userResult);
    } catch (err: any) {
        return sendError(res, 404, "Usuário não encontrado.", err);
    }
}

export const handleUserRecentReq = async (req: FastifyRequest<{ Params: GetUserInput, Querystring: ScoreQueryInput }>, res: FastifyReply) => {
    try {
        const rawParam = req.params.id;
        const query = scoreQuerySchema.parse(req.query); 
        
        const identifier = /^\d+$/.test(rawParam) 
            ? (rawParam.length > 15 ? { discord_id: rawParam } : { id: Number(rawParam) })
            : { safe_name: toSafeName(rawParam) };

        const userRecentScores = await getUserRecent(identifier, query);
        return res.code(200).send(userRecentScores);
    } catch (err: any) {
        return sendError(res, 404, "Não foi possível carregar as plays recentes.", err);
    }
}

export const handleUserBestOnMapReq = async (req: FastifyRequest<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>, res: FastifyReply) => {
    try {
        const rawParam = req.params.id;
        const bmapId = Number(req.params.map);
        const query = scoreQueryModeSchema.parse(req.query);

        const identifier = /^\d+$/.test(rawParam) 
            ? (rawParam.length > 15 ? { discord_id: rawParam } : { id: Number(rawParam) })
            : { safe_name: toSafeName(rawParam) };

        const scoreResult = await getUserBestOnMap(identifier, bmapId, query);

        if (!scoreResult) {
            return sendError(res, 404, "Nenhum score encontrado para este mapa.");
        }

        return res.code(200).send(scoreResult);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, "Parâmetros de consulta inválidos.");
        }
        return sendError(res, 404, "Dados não encontrados.", err);
    }
}

export const handleGetMe = async (req: FastifyRequest, res: FastifyReply) => {
    try {
        const userFromToken = req.user as { id: number };
        const userProfile = await getUserStats({ id: userFromToken.id });
        return res.send(userProfile);
    } catch (err) {
        return sendError(res, 500, "Falha ao carregar seu perfil.", err);
    }
}

export const handlePostPfp = async (req: FastifyRequest<{ Body: PostPfpInput }>, res: FastifyReply) => {
    const data = await req.file();
    
    if (!data) {
        return sendError(res, 400, "Nenhum arquivo enviado.");
    }

    try {
        const payload = {
            discord_id: (data.fields.discord_id as any)?.value,
            avatar: data
        };

        const validatedData = postPfpSchema.parse(payload);
        const userPfp = await setUserPfp(validatedData);

        return res.status(200).send(userPfp);
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return sendError(res, 400, err.issues[0].message);
        }
        return sendError(res, 500, "Falha ao processar o upload da imagem.", err);
    }
}