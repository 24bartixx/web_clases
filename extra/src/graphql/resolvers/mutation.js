function buildMutationResolvers() {
  return {
    createUser: async (_, { input }, { repositories }) => {
      return repositories.users.create(input);
    },
    updateUser: async (_, { id, input }, { repositories }) => {
      return repositories.users.update(Number(id), input);
    },
    deleteUser: async (_, { id }, { repositories }) => {
      return repositories.users.delete(Number(id));
    },
    createTodo: async (_, { input }, { repositories }) => {
      return repositories.todos.create(input);
    },
    updateTodo: async (_, { id, input }, { repositories }) => {
      return repositories.todos.update(Number(id), input);
    },
    deleteTodo: async (_, { id }, { repositories }) => {
      return repositories.todos.delete(Number(id));
    },
  };
}

module.exports = buildMutationResolvers;
