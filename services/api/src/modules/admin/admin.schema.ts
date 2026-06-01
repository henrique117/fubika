import z from "zod";

export const targetUserSchema = z.object({
    target_id: z.number({ 
        error: "O ID do alvo é obrigatório e deve ser um número." 
    }).int("O ID deve ser um número inteiro.")
});

export type TargetUserInput = z.infer<typeof targetUserSchema>;