const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRootAbs = path.resolve(__dirname, "..");
const baselineFileAbs = path.join(__dirname, "lint-perf-baseline.json");

function runLintAndMeasureMs() {
  const startedAt = Date.now();
  const lintCommand = process.platform === "win32" ? "npm.cmd run lint" : "npm run lint";

  execSync(lintCommand, {
    cwd: repoRootAbs,
    stdio: "inherit",
    env: process.env,
  });

  return Date.now() - startedAt;
}

function main() {
  const baselineMs = runLintAndMeasureMs();
  const payload = {
    baselineMs,
    budgetMultiplier: 1.3,
    hardCapMs: 300000,
    recordedAt: new Date().toISOString(),
    notes: "Typed-lint performance baseline. Budget = baseline * 1.3, hard cap = 300000ms.",
  };

  fs.writeFileSync(baselineFileAbs, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`Recorded lint baseline: ${baselineMs}ms -> ${baselineFileAbs}`);
}

try {
  main();
} catch (error) {
  console.error(
    `lint perf baseline recording failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
