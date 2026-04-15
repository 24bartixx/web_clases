const fs = require("fs");
const path = require("path");

function collectGraphqlFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files.push(...collectGraphqlFiles(fullPath));
        return;
      }

      if (entry.isFile() && entry.name.endsWith(".graphql")) {
        files.push(fullPath);
      }
    });

  return files;
}

function loadTypeDefs() {
  const schemaDir = __dirname;
  const files = collectGraphqlFiles(schemaDir);

  return files.map((filePath) => fs.readFileSync(filePath, "utf-8")).join("\n");
}

module.exports = {
  loadTypeDefs,
};
