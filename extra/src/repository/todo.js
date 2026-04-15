const prisma = require("../db/prisma");

function mapTodo({ id, title, completed, userId }) {
  return {
    id,
    title,
    completed,
    user_id: userId,
  };
}

function toTodoPayload(input = {}) {
  const payload = {};

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.completed !== undefined) {
    payload.completed = input.completed;
  }

  const userId = input.userId ?? input.user_id;
  if (userId !== undefined) {
    payload.userId = Number(userId);
  }

  return payload;
}

const TodoRepository = {
  getAll: async () => {
    const todos = await prisma.todo.findMany();
    return todos.map(mapTodo);
  },

  getById: async (id) => {
    const todo = await prisma.todo.findUnique({
      where: { id: Number(id) },
    });

    if (!todo) {
      return null;
    }

    return mapTodo(todo);
  },

  create: async (input) => {
    const todo = await prisma.todo.create({
      data: toTodoPayload(input),
    });

    return mapTodo(todo);
  },

  update: async (id, input) => {
    const todoId = Number(id);
    const data = toTodoPayload(input);

    if (Object.keys(data).length === 0) {
      return TodoRepository.getById(todoId);
    }

    try {
      const todo = await prisma.todo.update({
        where: { id: todoId },
        data,
      });
      return mapTodo(todo);
    } catch (error) {
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  },

  delete: async (id) => {
    const todoId = Number(id);

    try {
      await prisma.todo.delete({
        where: { id: todoId },
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

module.exports = TodoRepository;
