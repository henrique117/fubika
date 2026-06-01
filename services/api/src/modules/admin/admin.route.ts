import { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeAdmin } from "../../middlewares/admin.middleware";
import { TargetUserInput, targetUserSchema } from "./admin.schema";
import { handleBan, handleGiveAdmin } from "./admin.controller";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";

const adminRoutes = async (server: FastifyInstance) => {
    
    server.post<{ Body: TargetUserInput }>('/ban', {
        schema: {
            body: targetUserSchema
        },
        preHandler: [
            authenticate,
            authorizeAdmin,
            authorizeDiscordOwnership
        ]
    }, handleBan);

    server.post<{ Body: TargetUserInput }>('/giveadmin', {
        schema: {
            body: targetUserSchema
        },
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleGiveAdmin);
};

export default adminRoutes;