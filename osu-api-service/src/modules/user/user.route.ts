import { FastifyInstance } from "fastify";
import { handleGetMe, handleGetUsersCount, handlePostPfp, handleUserBestOnMapReq, handleUserLogin, handleUserRecentReq, handleUserRegister, handleUserReq } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { GetUserInput, GetUserMapInput, ScoreQueryInput, ScoreQueryModeInput, PostPfpInput } from "./user.schema";

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);

    server.post<{ Body: PostPfpInput }>('/avatar', {
        preHandler: [authenticate]
    }, handlePostPfp);

    server.get('/me', {
        preHandler: [authenticate]
    }, handleGetMe);

    server.get<{ Params: GetUserInput }>('/:id', {
        preHandler: [authenticate]
    }, handleUserReq);

    server.get<{ Params: GetUserInput, Querystring: ScoreQueryInput }>('/:id/recent', {
        preHandler: [authenticate]
    }, handleUserRecentReq);

    server.get<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>('/:id/map/:map', {
        preHandler: [authenticate]
    }, handleUserBestOnMapReq);

    server.get('/count', handleGetUsersCount);
}

export default userRoutes;