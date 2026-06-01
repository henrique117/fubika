import z from "zod";

export const createInviteSchema = z.object({
    id: z.union([
        z.number({ error: "O ID deve ser um número inteiro válido." }).int(),
        z.string({ error: "O ID deve ser um texto válido." }).min(1, "O ID não pode estar vazio.")
    ])
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const checkInviteSchema = z.object({
    code: z.string({ 
        error: "O campo code é obrigatório e deve ser um texto." 
    }).min(1, "O código do convite não pode estar vazio."),
    
    id: z.number({ 
        error: "O campo id é obrigatório e deve ser um número." 
    }).int("O ID do utilizador deve ser um número inteiro.")
});

export type CheckInviteInput = z.infer<typeof checkInviteSchema>;