import { FastifyInstance } from "fastify";
import { handleUserLogin, handleUserRegister, handleUserReq } from "./user.controller";

interface UserProps {
    id: number
}

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);

    server.get<{ Params: UserProps }>('/:id', handleUserReq);
}

export default userRoutes;