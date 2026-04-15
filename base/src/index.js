const { createServer } = require("http");
const { createGraphQLServer } = require("./server");

const PORT = process.env.PORT || 4000;
const yoga = createGraphQLServer();
const server = createServer(yoga);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
