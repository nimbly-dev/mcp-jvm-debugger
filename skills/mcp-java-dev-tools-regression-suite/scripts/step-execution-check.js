#!/usr/bin/env node
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const steps = Array.isArray(input.steps) ? input.steps : [];
const failed = steps.filter((s) => s && s.status !== "pass").length;

const out = {
  status: failed > 0 ? "fail" : "pass",
  failedCount: failed,
  total: steps.length,
};

process.stdout.write(`${JSON.stringify(out)}\n`);

