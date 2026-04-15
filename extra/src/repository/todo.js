const prisma = require("../db/prisma");

function mapTodo({ id, title, completed, userId }) {
  return {
    id,
    title,
    completed,
    user_id: userId,
  };
}

const TodoRepository = {
  getAll: async () => {
    const todos = await prisma.todo.findMany();
    return todos.map(mapTodo);
  },

  getById: async (id) => {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      return null;
    }

    return mapTodo(todo);
  },
};

module.exports = TodoRepository;
