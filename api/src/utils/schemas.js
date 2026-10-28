import { z } from "zod/v4";

import { UserSchema, UserStatusSchema } from "#prisma/generated/zod/index.ts";

export const uuidIdSchema = z.object({ id: z.string().uuid() });

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const driverLoginBodySchema = credentialsSchema
  .extend(locationSchema.partial().shape)
  .refine(
    ({ latitude, longitude }) =>
      (latitude === undefined) === (longitude === undefined),
    { message: "Informe latitude e longitude juntas" },
  );

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
