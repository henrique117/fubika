import z from "zod";

const createApikeySchema = z.object({
    id_req: z.int("ID do usuário é obrigatório"),
    id_target: z.int("ID do usuário de destino é obrigatório"),
    name: z.string("Nome para a key é obrigatório")
})

export type CreateApikeyInput = z.infer<typeof createApikeySchema>