import { FastifyInstance } from "fastify";
import { handleApikeyCreate } from "./apikey.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";
import { CreateApikeyInput } from "./apikey.schema";

const apikeyRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: CreateApikeyInput }>('/', {
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleApikeyCreate);
}

export default apikeyRoutes;