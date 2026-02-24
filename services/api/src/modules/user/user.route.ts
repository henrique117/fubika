import { FastifyInstance } from "fastify";
import { handleGetMe, handleGetUsersCount, handlePostPfp, handleUserBestOnMapReq, handleUserLogin, handleUserRecentReq, handleUserRegister, handleUserReq } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";
import { 
    GetUserInput, 
    GetUserMapInput, 
    ScoreQueryInput, 
    ScoreQueryModeInput, 
    PostPfpInput,
    CreateUserInput,
    LoginUserInput,
    createUserInputSchema,
    loginUserInputSchema,
    getUserInputSchema,
    getUserMapInputSchema,
    scoreQuerySchema,
    scoreQueryModeSchema
} from "./user.schema";

const userRoutes = async (server: FastifyInstance) => {
    
    server.post<{ Body: CreateUserInput }>('/register', {
        schema: {
            body: createUserInputSchema
        }
    }, handleUserRegister);

    server.post<{ Body: LoginUserInput }>('/login', {
        schema: {
            body: loginUserInputSchema
        }
    }, handleUserLogin);

    server.post<{ Body: PostPfpInput }>('/avatar', {
        preHandler: [authenticate, authorizeDiscordOwnership]
    }, handlePostPfp);

    server.get('/me', {
        preHandler: [authenticate]
    }, handleGetMe);

    server.get<{ Params: GetUserInput }>('/:id', {
        schema: {
            params: getUserInputSchema
        },
        preHandler: [authenticate]
    }, handleUserReq);

    server.get<{ Params: GetUserInput, Querystring: ScoreQueryInput }>('/:id/recent', {
        schema: {
            params: getUserInputSchema,
            querystring: scoreQuerySchema
        },
        preHandler: [authenticate]
    }, handleUserRecentReq);

    server.get<{ Params: GetUserMapInput, Querystring: ScoreQueryModeInput }>('/:id/map/:map', {
        schema: {
            params: getUserMapInputSchema,
            querystring: scoreQueryModeSchema
        },
        preHandler: [authenticate]
    }, handleUserBestOnMapReq);

    server.get('/count', handleGetUsersCount);
}

export default userRoutes;