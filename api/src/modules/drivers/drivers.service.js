import bcrypt from "bcrypt";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "#db/prisma.js";
import { NotFoundError, UnauthorizedError } from "#utils/errors.js";
import { SALT_ROUNDS } from "#config/constants.js";
import { setStatus, updateUser } from "#modules/users/users.service.js";

export const index = () =>
  prisma.user.findMany({ where: { role: UserRole.DRIVER } });

export const show = (id) =>
  prisma.user
    .findFirst({ where: { id, role: UserRole.DRIVER } })
    .then((driver) => {
      if (!driver) throw new NotFoundError("Driver not found");
      return driver;
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

  return setStatus({
    id: driver.id,
    role: UserRole.DRIVER,
    status: UserStatus.ONLINE,
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
