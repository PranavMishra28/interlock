import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const files = [
  "AGENTS.md",
  "README.md",
  "SECURITY.md",
  "SUBMISSION.md",
  "HACKATHON_PROVENANCE.md",
  ...readdirSync(join(root, "docs"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => `docs/${name}`),
];

const slug = (heading) =>
  heading
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const failures = [];
for (const file of files) {
  const source = readFileSync(join(root, file), "utf8");
  for (const match of source.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const href = match[1];
    if (/^https?:\/\//.test(href)) {
      try {
        new URL(href);
      } catch {
        failures.push(`${file}: invalid URL ${href}`);
      }
      continue;
    }
    if (/^(mailto:|tel:)/.test(href)) continue;

    const [relative, fragment] = href.split("#", 2);
    const target = resolve(root, dirname(file), relative || file.split("/").at(-1));
    if (!existsSync(target)) {
      failures.push(`${file}: missing ${href}`);
      continue;
    }
    if (fragment && target.endsWith(".md")) {
      const anchors = new Set(
        readFileSync(target, "utf8")
          .split("\n")
          .filter((line) => /^#{1,6}\s/.test(line))
          .map((line) => slug(line.replace(/^#{1,6}\s+/, ""))),
      );
      if (!anchors.has(decodeURIComponent(fragment).toLowerCase())) {
        failures.push(`${file}: missing anchor ${href}`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`doc links: ${files.length} canonical Markdown files passed`);
