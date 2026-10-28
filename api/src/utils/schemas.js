import { z } from "zod/v4";

import { UserSchema, UserStatusSchema } from "#prisma/generated/zod/index.ts";

export const uuidIdSchema = z.object({ id: z.string().uuid() });

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createUserBodySchema = UserSchema.omit({
  id: true,
  createdAt: true,
  role: true,
  status: true,
}).extend({
  name: z.string().trim().min(1),
});

export const updateUserBodySchema = createUserBodySchema
  .pick({ name: true, email: true, phone: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const updateStatusBodySchema = z.object({
  status: UserStatusSchema,
});
