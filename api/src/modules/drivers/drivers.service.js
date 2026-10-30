import bcrypt from "bcrypt";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "#db/prisma.js";
import {
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
} from "#utils/errors.js";
import { SALT_ROUNDS } from "#config/constants.js";
import {
  OMIT_PASSWORD,
  setStatus,
  updateUser,
} from "#modules/users/users.service.js";
import { isSimulating } from "#modules/routing/routing.service.js";

export const index = () =>
  prisma.user.findMany({
    where: { role: UserRole.DRIVER },
    omit: OMIT_PASSWORD,
  });

export const show = (id) =>
  prisma.user.findFirst({
    where: { id, role: UserRole.DRIVER },
    include: { vehicle: true },
    omit: OMIT_PASSWORD,
  });

export const create = async ({ vehicle, ...data }) => {
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);

  const driver = await prisma.user.create({
    data: {
      ...data,
      password,
      role: UserRole.DRIVER,
      vehicle: { create: vehicle },
    },
    include: { vehicle: true },
  });
  const { password: _, ...rest } = driver;
  return rest;
};

export const login = async (data) => {
  const driver = await prisma.user.findFirst({
    where: { email: data.email, role: UserRole.DRIVER },
  });

  if (!driver || !(await bcrypt.compare(data.password, driver.password))) {
    throw new UnauthorizedError();
  }

  const { latitude, longitude } = data;
  const hasLocation = latitude !== undefined && longitude !== undefined;

  return updateUser({
    id: driver.id,
    role: UserRole.DRIVER,
    data: {
      status: UserStatus.ONLINE,
      ...(hasLocation && { vehicle: { update: { latitude, longitude } } }),
    },
    include: { vehicle: true },
  });
};

export const updateLocation = async (id, { latitude, longitude }) => {
  const driver = await prisma.user.findFirst({
    where: { id, role: UserRole.DRIVER },
    include: { vehicle: true },
  });
  if (!driver) throw new NotFoundError("Driver not found");
  if (driver.status !== UserStatus.ONLINE) {
    throw new UnprocessableEntityError("Driver is offline");
  }
  if (!driver.vehicle) throw new NotFoundError("Vehicle not found");

  if (isSimulating(driver.vehicle.id)) {
    throw new UnprocessableEntityError(
      "Vehicle is being simulated; stop the simulation to change its location",
    );
  }

  return prisma.vehicle.update({
    where: { id: driver.vehicle.id },
    data: { latitude, longitude },
  });
};

export const logout = (id) =>
  setStatus({ id, role: UserRole.DRIVER, status: UserStatus.OFFLINE });

export const update = (id, data) =>
  updateUser({ id, role: UserRole.DRIVER, data });

export const updateStatus = (id, status) =>
  setStatus({ id, role: UserRole.DRIVER, status });

export const indexConversations = (driverId) =>
  prisma.conversation.findMany({
    where: { driverId },
    include: {
      attendant: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
