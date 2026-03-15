import { FastifyInstance } from "fastify";
import { handleInviteCreate } from "./invite.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";
import { createInviteSchema, CreateInviteInput } from "./invite.schema";

const inviteRoutes = async (server: FastifyInstance) => {
    
    server.post<{ Body: CreateInviteInput }>('/create', {
        schema: {
            body: createInviteSchema
        },
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleInviteCreate);

};

export default inviteRoutes;