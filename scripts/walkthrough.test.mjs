import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("walkthrough preflight creates one empty ignored artifact and stays offline", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "interlock-walkthrough-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "scripts"));
  await copyFile(new URL("./walkthrough.mjs", import.meta.url), join(root, "scripts/walkthrough.mjs"));
  await writeFile(join(root, ".gitignore"), ".interlock/\n");
  await writeFile(
    join(root, ".hackathon-phase"),
    "PHASE=BUILD_ACTIVE\nAUTHORIZATION=RECORDED\nPREBUILD_COMMIT=test\n",
  );
  assert.equal(spawnSync("git", ["init", "--quiet"], { cwd: root }).status, 0);

  const result = spawnSync(process.execPath, [join(root, "scripts/walkthrough.mjs"), "--preflight"], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      INTERLOCK_COORDINATOR_URL: "http://127.0.0.1:9",
      INTERLOCK_COORDINATOR_TOKEN: "must-not-be-used",
      INTERLOCK_TARGET_URL: "https://127.0.0.1:9",
      CHECKOUT_FAULT_TOKEN: "must-not-be-used",
    },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /No service.+network call ran/);
  assert.match(result.stdout, /no Slack channel and no people talking/i);
  assert.match(result.stdout, /ordinary unmentioned message/i);
  assert.match(result.stdout, /Do not create channels or emulate people/i);

  const artifact = join(root, ".interlock/walkthrough-notes.md");
  assert.equal((await readFile(artifact)).length, 0);
  assert.equal(
    spawnSync("git", ["check-ignore", "--quiet", "--", artifact], { cwd: root }).status,
    0,
  );
});
