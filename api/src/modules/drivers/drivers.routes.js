import {
  uuidIdSchema,
  driverLoginBodySchema,
  locationSchema,
  createUserBodySchema,
} from "#utils/schemas.js";

import {
  index,
  show,
  create,
  updateLocation,
  login,
  logout,
  indexConversations,
} from "./drivers.service.js";

import { VehicleSchema } from "#prisma/generated/zod/index.ts";

export default async function driversRoutes(app) {
  app.get("/", { schema: { tags: ["Motoristas"] } }, () => index());

  app.get(
    "/:id",
    { schema: { tags: ["Motoristas"], params: uuidIdSchema } },
    (request) => show(request.params.id),
  );

  app.post(
    "/",
    { schema: { tags: ["Motoristas"], body: createDriverBodySchema } },
    (request, reply) => {
      reply.code(201);
      return create(request.body);
    },
  );

  app.post(
    "/login",
    { schema: { tags: ["Motoristas"], body: driverLoginBodySchema } },
    (request) => login(request.body),
  );

  app.patch(
    "/:id/location",
    {
      schema: {
        tags: ["Motoristas"],
        params: uuidIdSchema,
        body: locationSchema,
      },
    },
    (request) => updateLocation(request.params.id, request.body),
  );

  app.post(
    "/logout",
    { schema: { tags: ["Motoristas"], body: uuidIdSchema } },
    async (request, reply) => {
      await logout(request.body.id);
      reply.code(204).send();
    },
  );

  app.get(
    "/:id/conversations",
    { schema: { tags: ["Motoristas"], params: uuidIdSchema } },
    (request) => indexConversations(request.params.id),
  );
}

// Private

const createDriverBodySchema = createUserBodySchema.extend({
  vehicle: VehicleSchema.pick({ plate: true, latitude: true, longitude: true }),
});
