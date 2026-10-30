import {
  uuidIdSchema,
  credentialsSchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateStatusBodySchema,
} from "#utils/schemas.js";

import {
  index,
  show,
  create,
  update,
  updateStatus,
  login,
  logout,
  indexConversations,
} from "./attendants.service.js";

export default async function attendantsRoutes(app) {
  app.get("/", { schema: { tags: ["Atendentes"] } }, () => index());

  app.get(
    "/:id",
    { schema: { tags: ["Atendentes"], params: uuidIdSchema } },
    (request) => show(request.params.id),
  );

  app.post(
    "/",
    { schema: { tags: ["Atendentes"], body: createUserBodySchema } },
    (request, reply) => {
      reply.code(201);
      return create(request.body);
    },
  );

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Atendentes"],
        params: uuidIdSchema,
        body: updateUserBodySchema,
      },
    },
    (request) => update(request.params.id, request.body),
  );

  app.patch(
    "/:id/status",
    {
      schema: {
        tags: ["Atendentes"],
        params: uuidIdSchema,
        body: updateStatusBodySchema,
      },
    },
    (request) => updateStatus(request.params.id, request.body.status),
  );

  app.post(
    "/login",
    { schema: { tags: ["Atendentes"], body: credentialsSchema } },
    (request) => login(request.body),
  );

  app.post(
    "/logout",
    { schema: { tags: ["Atendentes"], body: uuidIdSchema } },
    async (request, reply) => {
      await logout(request.body.id);
      reply.code(204).send();
    },
  );

  app.get(
    "/:id/conversations",
    { schema: { tags: ["Atendentes"], params: uuidIdSchema } },
    (request) => indexConversations(request.params.id),
  );
}
