const fs = require("fs");
const path = require("path");

function loadTypeDefs() {
  const schemaDir = __dirname;
  const files = fs
    .readdirSync(schemaDir)
    .filter((file) => file.endsWith(".graphql"))
    .sort();

  return files
    .map((file) => fs.readFileSync(path.join(schemaDir, file), "utf-8"))
    .join("\n");
}

module.exports = {
  loadTypeDefs,
};
