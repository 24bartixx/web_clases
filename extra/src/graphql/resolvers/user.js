const User = {
  todos: async (parent, _, { repositories }) => {
    const todos = await repositories.todos.getAll();
    return todos.filter((todo) => todo.user_id === parent.id);
  },
};

module.exports = User;
