import { FastifyInstance } from "fastify";
import { handleUserLogin, handleUserRegister } from "./user.controller";

const userRoutes = async (server: FastifyInstance) => {
    server.post('/register', handleUserRegister);
    server.post('/login', handleUserLogin);
}

export default userRoutes;