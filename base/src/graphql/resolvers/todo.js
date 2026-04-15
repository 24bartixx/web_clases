const ToDoItem = {
  user: async (parent, _, { loaders }) => {
    const users = await loaders.getUsers();
    return users.find((user) => user.id === parent.user_id) || null;
  },
};

module.exports = ToDoItem;
