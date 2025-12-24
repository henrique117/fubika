import z from "zod";

const createUserSchema = z.object({
    name: z.string({ message: "O nome de usuário deve ser um texto." }) 
        .min(3, "O nome de usuário deve ter pelo menos 3 caracteres.")
        .max(15, "O nome de usuário deve ter no máximo 15 caracteres.")
        .regex(/^[a-zA-Z0-9_\[\] ]+$/, "O nome contém caracteres inválidos."),

    email: z.string({ message: "O e-mail deve ser um texto." })
        .email("Por favor, digite um endereço de e-mail válido."),

    password: z.string({ message: "A senha deve ser um texto." })
        .min(6, "A senha deve ter pelo menos 6 caracteres.")
        .max(100, "A senha é muito longa."),

    key: z.string({ message: "O código de convite deve ser um texto." })
        .min(1, "O código de convite é obrigatório.")
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

const loginUserSchema = z.object({
    name: z.string({ message: "O nome de usuário deve ser um texto." }),
    password: z.string({ message: "A senha deve ser um texto." })
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

const getUserSchema = z.object({
    id: z.string()
});

export type GetUserInput = z.infer<typeof getUserSchema>;

export const scoreQuerySchema = z.object({
    mode: z.coerce.number().int().min(0).max(8).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(5)
});

export type ScoreQueryInput = z.infer<typeof scoreQuerySchema>;