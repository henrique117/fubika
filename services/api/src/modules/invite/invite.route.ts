import { FastifyInstance } from "fastify";
import { handleInviteCreate } from "./invite.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";

const inviteRoutes = async (server: FastifyInstance) => {
    server.addHook('onRequest', authenticate);
    server.addHook('onRequest', authorizeDiscordOwnership);

    server.post('/create', handleInviteCreate);
}

export default inviteRoutes;