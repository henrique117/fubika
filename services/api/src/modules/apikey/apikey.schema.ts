import z from "zod";

export const createApikeySchema = z.object({
    id_req: z.number({ 
        error: "O ID do requerente é obrigatório e deve ser um número" 
    }).int("O ID deve ser um número inteiro"),
    
    id_target: z.number({ 
        error: "O ID de destino é obrigatório e deve ser um número" 
    }).int("O ID de destino deve ser um número inteiro"),
    
    name: z.string({ 
        error: "Nome para a key é obrigatório e deve ser um texto" 
    }).min(3, "O nome deve ter pelo menos 3 caracteres")
});

export type CreateApikeyInput = z.infer<typeof createApikeySchema>;