import { EmergencyCallStatus } from "@prisma/client";
import { prisma } from "#db/prisma.js";
import { NotFoundError } from "#utils/errors.js";

import {
  notifyCallRegistered,
  notifyVehicleAssigned,
  notifyCallConcluded,
} from "#modules/notifications/notifications.service.js";

export const index = () => prisma.emergencyCall.findMany();

export const show = (id) =>
  prisma.emergencyCall.findUnique({ where: { id } }).then((emergencyCall) => {
    if (!emergencyCall) throw new NotFoundError("Emergency call not found");
    return emergencyCall;
  });

export const getLocation = (id) =>
  prisma.vehicleEmergencyCall
    .findFirst({
      where: { emergencyCallId: id },
      include: { vehicle: true },
    })
    .then((record) => {
      if (!record) throw new NotFoundError("Emergency call not found");
      return {
        latitude: record.vehicle.latitude,
        longitude: record.vehicle.longitude,
      };
    });

export const create = async ({ driverId, ...data }) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { driverId } });
  if (!vehicle) throw new NotFoundError("Vehicle not found for this driver");

  return prisma.$transaction(async (tx) => {
    const emergencyCall = await tx.emergencyCall.create({ data });

    await tx.vehicleEmergencyCall.create({
      data: { vehicleId: vehicle.id, emergencyCallId: emergencyCall.id },
    });

    await notifyCallRegistered(emergencyCall.id, tx);
    await notifyVehicleAssigned(emergencyCall.id, vehicle.plate, tx);

    return emergencyCall;
  });
};

export const conclude = async (id) => {
  const emergencyCall = await prisma.emergencyCall.findUnique({
    where: { id },
  });
  if (!emergencyCall) throw new NotFoundError("Emergency call not found");

  return prisma.$transaction(async (tx) => {
    const result = await tx.vehicleEmergencyCall.updateMany({
      where: {
        emergencyCallId: id,
        status: { not: EmergencyCallStatus.FINISHED },
      },
      data: { status: EmergencyCallStatus.FINISHED },
    });

    if (result.count > 0) await notifyCallConcluded(id, tx);

    return result;
  });
};

export const indexNotifications = async (emergencyCallId) => {
  const emergencyCall = await prisma.emergencyCall.findUnique({
    where: { id: emergencyCallId },
  });
  if (!emergencyCall) throw new NotFoundError("Emergency call not found");

  return prisma.notification.findMany({
    where: { emergencyCallId },
    orderBy: { notifiedAt: "desc" },
  });
};
