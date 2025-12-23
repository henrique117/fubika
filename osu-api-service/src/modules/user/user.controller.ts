import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, getUserStats, loginUser } from "./user.service";
import { CreateUserInput, GetUserInput, LoginUserInput } from "./user.schema";

export const handleUserLogin = async (req: FastifyRequest<{ Body: LoginUserInput }>, res: FastifyReply) => {
    try {
        const body = req.body;

        const user = await loginUser(body);

        const token = req.server.jwt.sign({
            id: user.id,
            name: user.name,
            priv: user.priv
        }, {
            expiresIn: '7d'
        });

        return res.send({ token });

    } catch (err: any) {
        return res.code(401).send({ message: err.message });
    }
}

export const handleUserRegister = async (
    req: FastifyRequest<{ Body: CreateUserInput }>,
    res: FastifyReply
) => {

    const body = req.body;

    try {
        const user = await createUser(body);

        return res.code(201).send(user);
    } catch (err) {
        return res.code(401).send(err);
    }
}

export const handleUserReq = async (
    req: FastifyRequest<{ Params: GetUserInput }>,
    res: FastifyReply
) => {
    try {
        const rawId = req.params.id;

        if (!/^\d+$/.test(rawId)) {
            return res.code(400).send({ error: "O ID fornecido não é válido (apenas números)." });
        }

        let user;

        if (rawId.length > 15) {
            user = await getUserStats({ discord_id: rawId });
        } else {
            user = await getUserStats({ id: Number(rawId) });
        }

        return res.code(200).send(user);

    } catch (err: any) {
        console.error("Erro ao buscar usuário:", err);

        if (err.message === "Usuário não encontrado" || err.message.includes("inválido")) {
            return res.code(404).send({ 
                error: "Not Found", 
                message: err.message 
            });
        }

        return res.code(500).send({ 
            error: "Internal Server Error",
            message: "Erro interno ao buscar dados do usuário." 
        });
    }
}