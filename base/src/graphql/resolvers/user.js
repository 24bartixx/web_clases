const User = {
  todos: async (parent, _, { loaders }) => {
    const todos = await loaders.getTodos();
    return todos.filter((todo) => todo.user_id === parent.id);
  },
};

module.exports = User;
