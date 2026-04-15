function buildQueryResolvers() {
  return {
    users: (_, __, { repositories }) => repositories.users.getAll(),
    todos: (_, __, { repositories }) => repositories.todos.getAll(),
    user: async (_, { id }, { repositories }) => {
      const userId = Number(id);
      return repositories.users.getById(userId);
    },
    todo: async (_, { id }, { repositories }) => {
      const todoId = Number(id);
      return repositories.todos.getById(todoId);
    },
  };
}

module.exports = buildQueryResolvers;
