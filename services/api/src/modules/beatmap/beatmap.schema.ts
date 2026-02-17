import z from "zod";

const beatmaps = z.object({
    id: z.int("Campo obrigatório")
});

export type SearchBeatmaps = z.infer<typeof beatmaps>;