import { FastifyInstance } from "fastify";
import { handleUserLogin, handleUserRegister, handleUserReq } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";

interface UserProps {
    id: number
}

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);

    server.get<{ Params: UserProps }>('/:id', {
        preHandler: [authenticate]
    }, handleUserReq);
}

export default userRoutes;