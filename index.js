#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function checkLogs() {
  const currentDir = process.cwd();
  const searchDir = path.join(currentDir, "src");

  const yellow = "\x1b[33m";
  const reset = "\x1b[0m";

  let blockStack = []; // Stack to manage block types (try, catch, finally, etc.)

  function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        traverseDir(fullPath);
      } else if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
        checkFileForLogs(fullPath);
      }
    }
  }

  function checkFileForLogs(filePath) {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    traverse(ast, {
      enter(path) {
        if (
          ["TryStatement", "CatchClause", "BlockStatement"].includes(
            path.node.type
          )
        ) {
          blockStack.push(path.node.type);
        }

        const inTryCatchFinallyBlock =
          blockStack.includes("TryStatement") ||
          blockStack.includes("CatchClause");

        if (path.node.type === "CallExpression") {
          const callee = path.node.callee;

          if (inTryCatchFinallyBlock) {
            return;
          }

          if (
            callee.type === "MemberExpression" &&
            callee.object.name === "console" &&
            callee.property.name === "log"
          ) {
            const line = path.node.loc.start.line;

            console.warn(
              `${yellow}Found a ${"\x1b[4m"}console.log${"\x1b[24m"} at line ${line}, in file ${filePath}${reset}`
            );
          }
        }
      },
      exit(path) {
        if (
          blockStack.length > 0 &&
          blockStack[blockStack.length - 1] === path.node.type
        ) {
          blockStack.pop();
        }
      },
    });
  }

  traverseDir(searchDir);
}

checkLogs();
