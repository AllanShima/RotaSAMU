import { prisma } from "#db/prisma.js";

export const notifyCallRegistered = (emergencyCallId, client = prisma) =>
  create(emergencyCallId, "Chamado registrado.", client);

export const notifyVehicleAssigned = (
  emergencyCallId,
  plate,
  client = prisma,
) => create(emergencyCallId, `Veículo ${plate} designado ao chamado.`, client);

export const notifyVehicleEnRoute = (emergencyCallId, plate, client = prisma) =>
  create(emergencyCallId, `Veículo ${plate} a caminho do local.`, client);

export const notifyVehicleArrived = (emergencyCallId, plate, client = prisma) =>
  create(emergencyCallId, `Veículo ${plate} chegou ao local.`, client);

export const notifyCallConcluded = (emergencyCallId, client = prisma) =>
  create(emergencyCallId, "Chamado concluído.", client);

// Private

const create = (emergencyCallId, message, client) =>
  client.notification.create({ data: { emergencyCallId, message } });
