import z from "zod";

export const getGlobalRankSchema = z.object({
    page: z.coerce.number({ 
        error: "A página deve ser um número válido." 
    })
    .int("A página deve ser um número inteiro.")
    .min(1, "A página não pode ser menor que 1.")
    .default(1),
    
    mode: z.coerce.number({ 
        error: "O modo deve ser um número válido." 
    })
    .int("O modo deve ser um número inteiro.")
    .min(0, "O modo não pode ser menor que 0.")
    .max(8, "Modo de jogo desconhecido.")
    .default(0)
});

export type GetGlobalRankInput = z.infer<typeof getGlobalRankSchema>;