#!/usr/bin/env node
/**
 * Generates a bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 * Usage (run from the project root):
 *   node scripts/hash-password.cjs
 *   bun scripts/hash-password.cjs
 *
 * You will be prompted for the password (typed characters are hidden).
 *
 * Optional: pass the password as the first argument. Less safe because it
 * stays in your shell history, so the interactive prompt is recommended:
 *   node scripts/hash-password.cjs "my-secret-password"
 *
 * The bcrypt cost factor can be set with the BCRYPT_COST env var (default 12).
 */
"use strict";

/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS script */
const bcrypt = require("bcryptjs");
const readline = require("node:readline");

function promptHidden(message) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const stdin = process.stdin;
    process.stdout.write(message);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const onData = (char) => {
      if (char === "\u0003") {
        cleanup();
        reject(new Error("Aborted."));
      } else if (char === "\r" || char === "\n" || char === "\u0004") {
        cleanup();
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    };

    function cleanup() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      rl.close();
    }

    stdin.on("data", onData);
  });
}

async function main() {
  const argPassword = process.argv[2];
  const password = argPassword ?? (await promptHidden("Admin password: "));
  if (!password) {
    throw new Error("Password cannot be empty.");
  }

  const cost = /^\d+$/.test(process.env.BCRYPT_COST ?? "")
    ? Number(process.env.BCRYPT_COST)
    : 12;

  const hash = bcrypt.hashSync(password, cost);
  if (!bcrypt.compareSync(password, hash)) {
    throw new Error("Failed to verify the generated hash.");
  }

  // Only the hash is printed. Never print the plain password.
  // Single quotes protect the $ characters (e.g. $2b$) from env-file expansion.
  console.log(`ADMIN_PASSWORD_HASH='${hash}'`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });