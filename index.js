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
      else if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
        checkFileForLogs(fullPath);
      }
    }
  }

  // Function to check a single file for console.log statements
  function checkFileForLogs(filePath) {
    // Read the file and parse it into an AST (Abstract Syntax Tree)
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    let inTryCatchFinallyBlock = false;

    // Traverse the AST to find console.log statements
    traverse(ast, {
      enter(path) {
        // Detect if we are inside a try-catch block
        if (
          path.node.type === "TryStatement" ||
          path.node.type === "CatchClause"
        ) {
          inTryCatchFinallyBlock = true;
        }

        // Detect if we are inside a block that's not part of a try-catch
        if (
          path.node.type === "BlockStatement" &&
          path.parent.type !== "TryStatement" &&
          path.parent.type !== "CatchClause"
        ) {
          inTryCatchFinallyBlock = false;
        }

        // Skip nodes within a try-catch block
        if (inTryCatchFinallyBlock) {
          return;
        }

        // Check for console.log calls
        if (path.node.type === "CallExpression") {
          const callee = path.node.callee;
          if (
            callee.type === "MemberExpression" &&
            callee.object.name === "console" &&
            callee.property.name === "log"
          ) {
            // Get the line and column number for the log statement
            const line = path.node.loc.start.line;
            const column = path.node.loc.start.column;

            // Print the warning message
            console.warn(
              `${yellow}Found a ${"\x1b[4m"}console.log${"\x1b[24m"} at line ${line}, column ${column} in file ${filePath}${reset}`
            );

            // Increment the counter for total logs found
            totalLogsFound++;
          }
        }
      },
      exit(path) {
        // Detect exiting a try-catch block
        if (
          path.node.type === "TryStatement" ||
          path.node.type === "CatchClause"
        ) {
          inTryCatchFinallyBlock = false;
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
