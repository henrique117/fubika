import { FastifyInstance } from "fastify";
import { handleApikeyCreate } from "./apikey.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeDiscordOwnership } from "../../middlewares/ownership.middleware";
import { createApikeySchema, CreateApikeyInput } from "./apikey.schema";

const apikeyRoutes = async (server: FastifyInstance) => {
    server.post<{ Body: CreateApikeyInput }>('/', {
        schema: {
            body: createApikeySchema
        },
        preHandler: [
            authenticate,
            authorizeDiscordOwnership
        ]
    }, handleApikeyCreate);
};

export default apikeyRoutes;