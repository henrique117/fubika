import { FastifyInstance } from "fastify";
import { handleUserLogin, handleUserRegister, handleUserReq } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { GetUserInput } from "./user.schema";

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);

    server.get<{ Params: GetUserInput }>('/:id', {
        preHandler: [authenticate]
    }, handleUserReq);
}

export default userRoutes;