import { FastifyInstance } from "fastify";
import { handleUserBestOnMapReq, handleUserLogin, handleUserRecentReq, handleUserRegister, handleUserReq } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { GetUserInput, GetUserMapInput, ScoreQueryInput, ScoreQueryModeInput } from "./user.schema";

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);

    server.get<{ Params: GetUserInput }>('/:id', {
        preHandler: [authenticate]
    }, handleUserReq);

    server.get<{ Params: GetUserInput, Querystring: ScoreQueryInput }>('/:id/recent', {
        preHandler: [authenticate]
    }, handleUserRecentReq);

    server.get<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>('/:id/map/:map', {
        preHandler: [authenticate]
    }, handleUserBestOnMapReq);
}

export default userRoutes;