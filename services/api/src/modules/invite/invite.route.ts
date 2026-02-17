import { FastifyInstance } from "fastify";
import { handleInviteCreate } from "./invite.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const inviteRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);

    server.post('/create', handleInviteCreate);
}

export default inviteRoutes;