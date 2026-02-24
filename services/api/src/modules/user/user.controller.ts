import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, getUserBestOnMap, getUserRecent, getUsersCount, getUserStats, loginUser, setUserPfp } from "./user.service";
import { CreateUserInput, GetUserInput, GetUserMapInput, LoginUserInput, PostPfpInput, postPfpSchema, ScoreQueryInput, ScoreQueryModeInput } from "./user.schema";
import { Errors } from "../../utils/errorHandler";

const toSafeName = (name: string) => name.trim().toLowerCase().replace(/ /g, '_');

export const handleGetUsersCount = async (_: any, res: FastifyReply) => {
    const userCount = await getUsersCount();
    return res.send(userCount);
}

export const handleUserLogin = async (req: FastifyRequest<{ Body: LoginUserInput }>, res: FastifyReply) => {
    const user = await loginUser(req.body);

    const token = req.server.jwt.sign({
        id: user.id,
        name: user.name,
    }, {
        expiresIn: '7d'
    });

    return res.send({ token, user });
}

export const handleUserRegister = async (req: FastifyRequest<{ Body: CreateUserInput }>, res: FastifyReply) => {
    const user = await createUser(req.body);
    return res.code(201).send(user);
}

export const handleUserReq = async (req: FastifyRequest<{ Params: GetUserInput }>, res: FastifyReply) => {
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
}

export const handleUserRecentReq = async (req: FastifyRequest<{ Params: GetUserInput, Querystring: ScoreQueryInput }>, res: FastifyReply) => {
    const rawParam = req.params.id;
    
    const identifier = /^\d+$/.test(rawParam) 
        ? (rawParam.length > 15 ? { discord_id: rawParam } : { id: Number(rawParam) })
        : { safe_name: toSafeName(rawParam) };

    const userRecentScores = await getUserRecent(identifier, req.query);
    return res.code(200).send(userRecentScores);
}

export const handleUserBestOnMapReq = async (req: FastifyRequest<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>, res: FastifyReply) => {
    const rawParam = req.params.id;
    const bmapId = Number(req.params.map);

    const identifier = /^\d+$/.test(rawParam) 
        ? (rawParam.length > 15 ? { discord_id: rawParam } : { id: Number(rawParam) })
        : { safe_name: toSafeName(rawParam) };

    const scoreResult = await getUserBestOnMap(identifier, bmapId, req.query);

    if (!scoreResult) {
        throw Errors.NotFound("Nenhum score encontrado para este mapa.");
    }

    return res.code(200).send(scoreResult);
}

export const handleGetMe = async (req: FastifyRequest, res: FastifyReply) => {
    const userFromToken = req.user as { id: number };
    const userProfile = await getUserStats({ id: userFromToken.id });
    return res.send(userProfile);
}

export const handlePostPfp = async (req: FastifyRequest<{ Body: PostPfpInput }>, res: FastifyReply) => {
    const data = await req.file();
    
    if (!data) {
        throw Errors.BadRequest("Nenhum arquivo enviado.");
    }

    const payload = {
        discord_id: (data.fields.discord_id as any)?.value,
        avatar: data
    };

    const validatedData = postPfpSchema.parse(payload);
    
    const userPfp = await setUserPfp(validatedData);

    return res.status(200).send(userPfp);
}