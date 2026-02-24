import z from "zod";

export const createUserInputSchema = z.object({
    name: z.string({ error: "O nome de usuário deve ser um texto." }) 
        .min(3, "O nome de usuário deve ter pelo menos 3 caracteres.")
        .max(15, "O nome de usuário deve ter no máximo 15 caracteres.")
        .regex(/^[a-zA-Z0-9_\[\] ]+$/, "O nome contém caracteres inválidos."),

    email: z.string({ error: "O e-mail deve ser um texto." })
        .email("Por favor, digite um endereço de e-mail válido."),

    password: z.string({ error: "A senha deve ser um texto." })
        .min(6, "A senha deve ter pelo menos 6 caracteres.")
        .max(100, "A senha é muito longa."),

    key: z.string({ error: "O código de convite deve ser um texto." })
        .min(1, "O código de convite é obrigatório.")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginUserInputSchema = z.object({
    name: z.string({ error: "O nome de usuário deve ser um texto." }),
    password: z.string({ error: "A senha deve ser um texto." })
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

export const getUserInputSchema = z.object({
    id: z.string()
});

export type GetUserInput = z.infer<typeof getUserInputSchema>;

export const scoreQuerySchema = z.object({
    mode: z.coerce.number().int().min(0).max(8).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(5)
});

export type ScoreQueryInput = z.infer<typeof scoreQuerySchema>;

export const scoreQueryModeSchema = z.object({
    mode: z.coerce.number().int().min(0).max(8).default(0),
});

export type ScoreQueryModeInput = z.infer<typeof scoreQueryModeSchema>;

export const getUserMapInputSchema = z.object({
    id: z.string(),
    map: z.coerce.number().int()
});

export type GetUserMapInput = z.infer<typeof getUserMapInputSchema>;

export const postPfpSchema = z.object({
    discord_id: z.string().regex(/^\d+$/, "Discord ID inválido"),
    avatar: z.any()
        .refine((file) => !!file, "Arquivo é obrigatório")
        .refine(
            (file) => file.mimetype?.startsWith("image/"),
            "O arquivo deve ser uma imagem (png, jpg, etc)"
        )
});

export type PostPfpInput = z.infer<typeof postPfpSchema>;