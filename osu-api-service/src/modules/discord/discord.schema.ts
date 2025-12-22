import z from "zod";

const createDiscordLink = z.object({
    discord_id: z.string('Campo discord_id é obrigatório'),
    osu_name: z.string('Campo osu_name é obrigatório')
});

export type CreateDiscordLink = z.infer<typeof createDiscordLink>;