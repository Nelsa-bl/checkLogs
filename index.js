#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// Main function to check for console.log statements in files
function checkLogs() {
  // Parse command line arguments to find the folder to check
  const args = process.argv.slice(2);
  const folderToCheck = args[0] || "src";

  // Get the current working directory and the directory to search
  const currentDir = process.cwd();
  const searchDir = path.join(currentDir, folderToCheck);

  // Initialize a counter for console.log occurrences
  let totalLogsFound = 0;

  // ANSI escape codes for coloring console output
  const yellow = "\x1b[33m";
  const green = "\x1b[32m";
  const reset = "\x1b[0m";

  // Function to traverse a directory recursively
  function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      // If it's a directory, traverse it
      if (stats.isDirectory()) {
        traverseDir(fullPath);
      }
      // If it's a file with a certain extension, check for logs
      else if (
        stats.isFile() &&
        /\.(js|jsx|ts|tsx)$/.test(file) &&
        !file.includes("stories.tsx")
      ) {
        checkFileForLogs(fullPath);
      }
    }
  }

  // Function to check a single file for console.log statements
  function checkFileForLogs(filePath) {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let blockStack = [];

    traverse(ast, {
      enter(path) {
        if (
          ["TryStatement", "CatchClause", "FinallyStatement"].includes(
            path.node.type
          )
        ) {
          blockStack.push(path.node.type);
        }

        if (
          path.node.type === "CallExpression" &&
          path.node.callee.property &&
          ["then", "catch", "finally"].includes(path.node.callee.property.name)
        ) {
          blockStack.push(path.node.callee.property.name);
        }

        if (blockStack.length === 0) {
          if (path.node.type === "CallExpression") {
            const callee = path.node.callee;
            if (
              callee.type === "MemberExpression" &&
              callee.object.name === "console" &&
              callee.property.name === "log"
            ) {
              const line = path.node.loc.start.line;
              const column = path.node.loc.start.column;
              const relativePath = filePath.split("src")[1] || filePath; // If "src" doesn't exist in the path, use the full path
              console.warn(
                `${yellow}Found a console.log at line ${line}, column ${column} in file \x1b]8;;file://${filePath}\x07${relativePath}\x1b]8;;\x07${reset}`
              );
              totalLogsFound++;
            }
          }
        }
      },
      exit(path) {
        if (
          ["TryStatement", "CatchClause", "FinallyStatement"].includes(
            path.node.type
          )
        ) {
          blockStack.pop();
        }

        if (
          path.node.type === "CallExpression" &&
          path.node.callee.property &&
          ["then", "catch", "finally"].includes(path.node.callee.property.name)
        ) {
          blockStack.pop();
        }
      },
    });
  }

  // Start traversing from the root directory
  traverseDir(searchDir);

  // Display summary
  if (totalLogsFound === 0) {
    console.log(`${green}✔ You are good to go!${reset}`);
  } else {
    console.warn(`${yellow}Total console.log found: ${totalLogsFound}${reset}`);
  }
}

// Run the main function
checkLogs();
