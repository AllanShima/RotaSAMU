import { afterAll, beforeAll, beforeEach } from "vitest";
import { UserRole } from "@prisma/client";

import { buildApp } from "../src/app.js";
import { prisma } from "#db/prisma.js";
import { assertTestDatabase } from "./support/test-database.js";

export const useTestApp = () => {
  const context = {};

  beforeAll(async () => {
    context.app = await buildApp({ logger: false });
    await context.app.ready();
  });

  beforeEach(resetDatabase);

  afterAll(async () => {
    await context.app.close();
    await prisma.$disconnect();
  });

  return context;
};

export const createAttendant = (overrides = {}) =>
  prisma.user.create({
    data: {
      email: `attendant${nextNumber()}@example.com`,
      password: "hashed-password",
      phone: "14999999999",
      role: UserRole.ATTENDANT,
      ...overrides,
    },
  });

export const createDriver = ({ vehicle, ...overrides } = {}) => {
  const number = nextNumber();

  return prisma.user.create({
    data: {
      email: `driver${number}@example.com`,
      password: "hashed-password",
      phone: "14999999999",
      role: UserRole.DRIVER,
      vehicle: {
        create: {
          plate: `TST${String(number).padStart(4, "0")}`,
          latitude: -22.2139,
          longitude: -49.9458,
          ...vehicle,
        },
      },
      ...overrides,
    },
    include: { vehicle: true },
  });
};

export const emergencyCallPayload = ({
  attendantId,
  driverId,
  ...overrides
}) => ({
  protocol: `PROTO-${nextNumber()}`,
  address: "Rua das Flores, 100",
  returnLocation: "Hospital Regional",
  whatHappened: "Queda de nível",
  patientCondition: "Consciente",
  apparentAge: 40,
  patientCount: 1,
  injuryCondition: "Escoriações leves",
  observations: null,
  attendantId,
  driverId,
  ...overrides,
});

// Private

let sequence = 0;
const nextNumber = () => ++sequence;

async function resetDatabase() {
  assertTestDatabase(process.env.DATABASE_URL);

  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const names = tables.map(({ tablename }) => `"${tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`,
  );
}
