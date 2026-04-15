const prisma = require("../db/prisma");

function toUserPayload(input = {}) {
  const payload = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }

  if (input.login !== undefined) {
    payload.login = input.login;
  }

  if (input.email !== undefined) {
    payload.email = input.email;
  }

  return payload;
}

const UserRepository = {
  getAll: async () => {
    const users = await prisma.user.findMany();
    return users;
  },

  getById: async (id) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    return user;
  },

  create: async (input) => {
    return prisma.user.create({
      data: toUserPayload(input),
    });
  },

  update: async (id, input) => {
    const userId = Number(id);
    const data = toUserPayload(input);

    if (Object.keys(data).length === 0) {
      return UserRepository.getById(userId);
    }

    try {
      return await prisma.user.update({
        where: { id: userId },
        data,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  },

  delete: async (id) => {
    const userId = Number(id);

    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") {
        return false;
      }
      throw error;
    }
  },
};

module.exports = UserRepository;
