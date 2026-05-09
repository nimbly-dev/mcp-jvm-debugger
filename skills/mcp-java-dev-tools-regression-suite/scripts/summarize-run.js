#!/usr/bin/env node
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const now = Date.now();

const out = {
  status: input.status ?? "unknown",
  reasonCode: input.reasonCode ?? "unknown",
  runEndEpoch: now,
  checks: Array.isArray(input.checks) ? input.checks : [],
  nextAction: input.nextAction ?? "",
};

process.stdout.write(`${JSON.stringify(out)}\n`);

