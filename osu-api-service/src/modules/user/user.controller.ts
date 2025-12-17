import { FastifyReply, FastifyRequest } from "fastify";
import { createUser, loginUser } from "./user.service";
import { CreateUserInput, LoginUserInput } from "./user.schema";

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
        console.log(err);
        return res.code(401).send(err);
    }
}