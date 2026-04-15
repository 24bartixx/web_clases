function buildQueryResolvers() {
  return {
    users: (_, __, { loaders }) => loaders.getUsers(),
    todos: (_, __, { loaders }) => loaders.getTodos(),
    user: async (_, { id }, { loaders }) => {
      const userId = Number(id);
      const users = await loaders.getUsers();
      return users.find((user) => user.id === userId) || null;
    },
    todo: async (_, { id }, { loaders }) => {
      const todoId = Number(id);
      const todos = await loaders.getTodos();
      return todos.find((todo) => todo.id === todoId) || null;
    },
  };
}

module.exports = buildQueryResolvers;
