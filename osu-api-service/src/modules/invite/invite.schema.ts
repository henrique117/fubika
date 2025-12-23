import z from "zod";

const createInviteSchema = z.object({
    id: z.union([z.number().int(), z.string()])
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

const checkInviteSchema = z.object({
    code: z.string(),
    id: z.number().int()
});

export type CheckInviteInput = z.infer<typeof checkInviteSchema>;