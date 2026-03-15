import z from "zod";

export const searchBeatmapsSchema = z.object({
    id: z.coerce.number({ error: "O ID deve ser um número" }).int("O ID deve ser inteiro")
});

export type SearchBeatmaps = z.infer<typeof searchBeatmapsSchema>;