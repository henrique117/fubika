import z from "zod";

const createInviteSchema = z.object({
    id: z.int()
})

export type CreateInviteInput = z.infer<typeof createInviteSchema>

const checkInviteSchema = z.object({
    code: z.string(),
    id: z.int()
})

export type CheckInviteInput = z.infer<typeof checkInviteSchema>