import { FastifyInstance } from "fastify";
import { handleInviteCreate } from "./invite.controller";

const inviteRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', server.authenticate);

    server.post('/create', handleInviteCreate);
}

export default inviteRoutes;