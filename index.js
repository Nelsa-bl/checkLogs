#!/usr/bin/env node

// Importing required modules
const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// Starting a timer to measure script execution time
console.time("Execution Time");

// Main function to look for `console.log` occurrences
function checkLogs() {
  // Parsing command line arguments and defining the folder to check
  const args = process.argv.slice(2);
  const folderToCheck = args[0] || "src";
  const currentDir = process.cwd();
  const searchDir = path.join(currentDir, folderToCheck);

  // Initialize variables
  let totalLogsFound = 0;
  const yellow = "\x1b[33m";
  const green = "\x1b[32m";
  const reset = "\x1b[0m";

  // Function to traverse a directory and its subdirectories
  function traverseDir(dir) {
    // Read all files and directories inside the current directory
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      // If it's a directory, traverse it recursively
      if (stats.isDirectory()) {
        traverseDir(fullPath);
      }
      // If it's a file and has the specified extensions, check it for logs
      else if (
        stats.isFile() &&
        /\.(js|jsx|ts|tsx)$/.test(file) &&
        !file.includes("stories.tsx")
      ) {
        checkFileForLogs(fullPath);
      }
    }
  }

  // Function to check a file for `console.log` occurrences
  function checkFileForLogs(filePath) {
    // Read file content
    const code = fs.readFileSync(filePath, "utf-8");
    const lines = code.split("\n");
    const ignoredLines = new Set();

    // Loop through the lines to find lines that are meant to be ignored
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "// @ignore-console-log-warning-next-line") {
        ignoredLines.add(i + 2);
      }
    }

    // Parse the code into an AST (Abstract Syntax Tree)
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      comments: true,
    });

    let blockStack = [];

    // Traverse the AST
    traverse(ast, {
      // Called when entering a node
      enter(path) {
        // If the node is a part of error handling, push it to stack
        if (
          ["TryStatement", "CatchClause", "FinallyStatement"].includes(
            path.node.type
          )
        ) {
          blockStack.push(path.node.type);
        }

        // If the node is part of a Promise chain, push it to the stack
        if (
          path.node.type === "CallExpression" &&
          path.node.callee.property &&
          ["then", "catch", "finally"].includes(path.node.callee.property.name)
        ) {
          blockStack.push(path.node.callee.property.name);
        }

        // Check for `console.log` if not within a try-catch or Promise block
        if (blockStack.length === 0) {
          if (path.node.type === "CallExpression") {
            const line = path.node.loc.start.line;
            if (ignoredLines.has(line)) {
              return;
            }
            const callee = path.node.callee;
            if (
              callee.type === "MemberExpression" &&
              callee.object.name === "console" &&
              callee.property.name === "log"
            ) {
              const column = path.node.loc.start.column;
              const relativePath = filePath.split("src")[1] || filePath;
              console.warn(
                `${yellow}Found a console.log at line ${line}, column ${column} in file ${relativePath}${reset}`
              );
              totalLogsFound++;
            }
          }
        }
      },
      // Called when exiting a node
      exit(path) {
        // Remove the node from the stack if it's part of error handling or Promise chain
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

// Execute the main function
checkLogs();

// End the timer and display the time taken
console.timeEnd("Execution Time");
