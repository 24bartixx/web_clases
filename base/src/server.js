const { createYoga } = require("graphql-yoga");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { loadTypeDefs } = require("./graphql/schema");
const { createResolvers } = require("./graphql/resolvers");
const { fetchUsers, fetchTodos } = require("./data/api");

function memoizePromise(fn) {
  let promise;
  return () => {
    if (!promise) {
      promise = fn();
    }
    return promise;
  };
}

function createContext() {
  return {
    loaders: {
      getUsers: memoizePromise(fetchUsers),
      getTodos: memoizePromise(fetchTodos),
    },
  };
}

function createGraphQLServer() {
  const typeDefs = loadTypeDefs();
  const resolvers = createResolvers();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return createYoga({
    schema,
    context: createContext,
  });
}

module.exports = {
  createGraphQLServer,
};
