import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
} from "@fastify/type-provider-zod";
import cors from "@fastify/cors";
import { AppError } from "#utils/errors.js";
import { fromPrismaError } from "#utils/prisma-errors.js";

import attendantsRoutes from "#modules/attendants/attendants.routes.js";
import driversRoutes from "#modules/drivers/drivers.routes.js";
import emergencyCallsRoutes from "#modules/emergency-calls/emergency-calls.routes.js";
import conversationsRoutes from "#modules/conversations/conversations.routes.js";
import routingRoutes from "#modules/routing/routing.routes.js";
import { setupRealtime } from "#modules/routing/realtime.js";

export async function buildApp({ logger = true } = {}) {
  const app = Fastify({ logger });

  // Registrar o CORS
  await app.register(cors, {
    origin: "http://localhost:3000",
    credentials: true,
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // PATCH precisa estar na lista: o padrão do plugin é só GET, HEAD e POST.
  await app.register(fastifyCors, {
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  setupRealtime(app);

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "RotaSAMU API",
        description: "API documentation for the RotaSAMU system",
        version: "1.0.0",
      },
      tags: [
        {
          name: "Atendentes",
          description: "Gerenciamento e autenticação de atendentes",
        },
        {
          name: "Motoristas",
          description: "Gerenciamento e autenticação de motoristas",
        },
        {
          name: "Chamados de Emergência",
          description: "Despacho e acompanhamento de chamados",
        },
        {
          name: "Conversas",
          description: "Mensagens entre atendentes e motoristas",
        },
        {
          name: "Rotas (GPS)",
          description:
            "Cálculo de rotas (OSRM) e simulação de movimentação dos veículos",
        },
      ],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(fastifySwaggerUI, {
    routePrefix: "/docs",
  });

  app.register(attendantsRoutes, { prefix: "/attendants" });
  app.register(driversRoutes, { prefix: "/drivers" });
  app.register(emergencyCallsRoutes, { prefix: "/emergency-calls" });
  app.register(conversationsRoutes, { prefix: "/conversations" });
  app.register(routingRoutes, { prefix: "/routing" });

  app.setErrorHandler((error, request, reply) => {
    const appError = error instanceof AppError ? error : fromPrismaError(error);
    if (appError) {
      return reply
        .code(appError.statusCode)
        .send({ message: appError.message });
    }

    if (error.validation) {
      return reply
        .code(400)
        .send({ message: "Validation error", details: error.validation });
    }

    request.log.error(error);
    return reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}
