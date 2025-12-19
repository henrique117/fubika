import z from "zod";

export const getGlobalRankSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    mode: z.coerce.number().int().min(0).max(3).default(0)
});

export type GetGlobalRankInput = z.infer<typeof getGlobalRankSchema>;