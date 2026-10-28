import bcrypt from "bcrypt";

import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "#db/prisma.js";

import { NotFoundError, UnauthorizedError } from "#utils/errors.js";
import { SALT_ROUNDS } from "#config/constants.js";
import { setStatus, updateUser } from "#modules/users/users.service.js";

export const show = (id) =>
  prisma.user
    .findFirst({ where: { id, role: UserRole.ATTENDANT } })
    .then((attendant) => {
      if (!attendant) throw new NotFoundError("Attendant not found");
      return attendant;
    });

export const create = async (data) => {
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  const attendant = await prisma.user.create({
    data: { ...data, password, role: UserRole.ATTENDANT },
  });
  const { password: _, ...rest } = attendant;
  return rest;
};

export const login = async (data) => {
  const attendant = await prisma.user.findFirst({
    where: { email: data.email, role: UserRole.ATTENDANT },
  });

  if (
    !attendant ||
    !(await bcrypt.compare(data.password, attendant.password))
  ) {
    throw new UnauthorizedError();
  }

  return setStatus({
    id: attendant.id,
    role: UserRole.ATTENDANT,
    status: UserStatus.ONLINE,
  });
};

export const logout = (id) =>
  setStatus({ id, role: UserRole.ATTENDANT, status: UserStatus.OFFLINE });

export const update = (id, data) =>
  updateUser({ id, role: UserRole.ATTENDANT, data });

export const updateStatus = (id, status) =>
  setStatus({ id, role: UserRole.ATTENDANT, status });

export const indexConversations = (attendantId) =>
  prisma.conversation.findMany({
    where: { attendantId },
    include: {
      driver: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
