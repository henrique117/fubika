import z from "zod";

export const createDiscordLinkSchema = z.object({
    discord_id: z.string({ 
        error: "O campo discord_id é obrigatório e deve ser um texto." 
    }).min(1, "O discord_id não pode estar vazio."),
    
    osu_name: z.string({ 
        error: "O campo osu_name é obrigatório e deve ser um texto." 
    }).min(1, "O osu_name não pode estar vazio.")
});

export type CreateDiscordLink = z.infer<typeof createDiscordLinkSchema>;

export const checkDiscordLinkSchema = z.object({
    discord_id: z.string({ 
        error: "O campo discord_id é obrigatório e deve ser um texto." 
    }).min(1, "O discord_id não pode estar vazio."),
    
    code: z.string({ 
        error: "O campo code é obrigatório e deve ser um texto." 
    }).min(1, "O código de verificação não pode estar vazio.")
});

export type CheckDiscordLink = z.infer<typeof checkDiscordLinkSchema>;