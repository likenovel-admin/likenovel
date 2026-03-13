import fs from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true });

const ignoredDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  ".yarn",
  ".turbo",
  "dist",
  "build",
  "out",
]);

const allowedExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".txt",
  ".sql",
]);

const invalidFiles = [];

function isEnvFile(name) {
  return name === ".env" || name.startsWith(".env.");
}

function shouldCheckFile(name) {
  const ext = path.extname(name).toLowerCase();
  return allowedExtensions.has(ext) || isEnvFile(name);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      walk(fullPath);
      continue;
    }

    if (!shouldCheckFile(entry.name)) continue;

    const buffer = fs.readFileSync(fullPath);
    try {
      decoder.decode(buffer);
    } catch {
      invalidFiles.push(path.relative(root, fullPath));
    }
  }
}

walk(root);

if (invalidFiles.length > 0) {
  console.error("[check-utf8] Invalid UTF-8 files found:");
  for (const file of invalidFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("[check-utf8] OK");
