// Set a .env key only when it is absent or empty. Never prints a value.
import { readFileSync, writeFileSync } from "node:fs";

const [file, ...pairs] = process.argv.slice(2);
const lines = readFileSync(file, "utf8").split("\n");
const changed = [];

for (const pair of pairs) {
  const key = pair.slice(0, pair.indexOf("="));
  const value = pair.slice(pair.indexOf("=") + 1);
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index === -1) {
    lines.push(`${key}=${value}`);
    changed.push(key);
  } else if (!lines[index].slice(key.length + 1).trim()) {
    lines[index] = `${key}=${value}`;
    changed.push(key);
  }
}

writeFileSync(file, lines.filter((line, i) => line || i < lines.length - 1).join("\n").replace(/\n*$/, "\n"), { mode: 0o600 });
console.log(changed.length ? `set: ${changed.join(", ")}` : "no change");
