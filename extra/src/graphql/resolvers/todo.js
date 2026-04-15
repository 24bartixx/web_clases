const ToDoItem = {
  user: async (parent, _, { repositories }) => {
    return repositories.users.getById(parent.user_id);
  },
};

module.exports = ToDoItem;
