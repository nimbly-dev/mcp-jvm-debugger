const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRootAbs = path.resolve(__dirname, "..");
const baselineFileAbs = path.join(__dirname, "lint-perf-baseline.json");

function loadBaseline() {
  if (!fs.existsSync(baselineFileAbs)) {
    throw new Error(`missing ${path.basename(baselineFileAbs)}. Run: npm run lint:perf:record`);
  }

  const parsed = JSON.parse(fs.readFileSync(baselineFileAbs, "utf8"));
  if (!Number.isFinite(parsed.baselineMs) || parsed.baselineMs <= 0) {
    throw new Error("invalid baselineMs in lint-perf-baseline.json");
  }

  const budgetMultiplier = Number.isFinite(parsed.budgetMultiplier) ? parsed.budgetMultiplier : 1.3;
  const hardCapMs = Number.isFinite(parsed.hardCapMs) ? parsed.hardCapMs : 300000;

  return {
    baselineMs: parsed.baselineMs,
    budgetMultiplier,
    hardCapMs,
  };
}

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
  const baseline = loadBaseline();
  const elapsedMs = runLintAndMeasureMs();
  const budgetMs = Math.floor(baseline.baselineMs * baseline.budgetMultiplier);

  console.log(
    `Lint duration: ${elapsedMs}ms (baseline=${baseline.baselineMs}ms, budget=${budgetMs}ms, hardCap=${baseline.hardCapMs}ms)`,
  );

  if (elapsedMs > baseline.hardCapMs) {
    throw new Error(`lint duration exceeded hard cap (${baseline.hardCapMs}ms)`);
  }
  if (elapsedMs > budgetMs) {
    throw new Error(`lint duration exceeded budget (${budgetMs}ms)`);
  }
}

try {
  main();
} catch (error) {
  console.error(`lint perf check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
