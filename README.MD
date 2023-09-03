# React Logger Checker

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Global Installation](#global-installation)
  - [NPM - Global](#npm---global)
  - [Yarn - Global](#yarn---global)
- [Local Installation](#local-installation)
  - [NPM - Local](#npm---local)
  - [Yarn - Local](#yarn---local)
- [Usage](#usage)
- [Instructions](#instructions)
- [Authors](#authors)
- [Github](#github)

## Introduction

**React Logger Checker** is a Node.js CLI utility designed to identify `console.log` statements in your React codebase. It's perfect for developers who wish to clean up their code before production and maintain a cleaner, more performant application.

> :warning: **Keep your console clean**: It's a best practice to remove `console.log` statements from production code to improve performance and security!

## Features

- Scans `.js`, `.jsx`, `.ts`, `.tsx` files for any `console.log` statements
- Color-coded console warnings
- Line numbers and clickable file paths for quick navigation
- Ignores commented out `console.log` statements

## Global Installation

You can add **React Logger Checker** to your project via npm or Yarn.

### NPM

To install the package globally using npm, run:

```bash
npm install -g react-logger-checker
```

### Yarn

To install the package globally using Yarn, run:

```bash
yarn global add react-logger-checker
```

### Usage

If you've installed the package `globally`, you can run it from any directory by executing the `react-logger-checker` command in your terminal:

```bash
react-logger-checker
```

## Local Installation

If you prefer a project-specific installation, you can install it as a dev dependency:

### NPM

To install the package locally using npm, run:

```bash
npm install --save-dev react-logger-checker
```

### Yarn

To install the package locally using Yarn, run:

```bash
yarn add --dev react-logger-checker
```

After installing, add a script in your `package.json` to run the checker:

```json
"scripts": {
  "check-logs": "react-logger-checker"
}
```

Then run the script using:

```bash
npm run check-logs
```

or

```bash
yarn check-logs
```

## Instructions

Byd default this will scan all `.js`, `.jsx`, `.ts`, and `.tsx` files within the `src` directory and display any `console.log` statements found.

### Specifying a Custom Folder

You can specify a custom folder to check by adding it as an argument to the command:

```bash
npm run check-logs frontend
```

or

```bash
yarn check-logs frontend/components
```

This will then scan the specified folder for any console.log statements.

## Authors

- Sanel Babij

##

## Github

[Github link](https://github.com/Nelsa-bl/checkLogs)

##
