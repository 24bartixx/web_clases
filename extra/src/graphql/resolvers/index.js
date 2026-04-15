const buildQueryResolvers = require("./query");
const buildMutationResolvers = require("./mutation");
const User = require("./user");
const ToDoItem = require("./todo");

function createResolvers() {
  return {
    Query: buildQueryResolvers(),
    Mutation: buildMutationResolvers(),
    User,
    ToDoItem,
  };
}

module.exports = {
  createResolvers,
};
