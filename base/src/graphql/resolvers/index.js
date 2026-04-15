const buildQueryResolvers = require("./query");
const User = require("./user");
const ToDoItem = require("./todo");

function createResolvers() {
  return {
    Query: buildQueryResolvers(),
    User,
    ToDoItem,
  };
}

module.exports = {
  createResolvers,
};
