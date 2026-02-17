import { FastifyInstance } from "fastify";
import { handleApikeyCreate } from "./apikey.controller";

const apikeyRoutes = async (server: FastifyInstance) => {
    server.post('/', handleApikeyCreate);
}

export default apikeyRoutes;