#!/usr/bin/env node
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const startedByRun = Array.isArray(input.startedByRun) ? input.startedByRun : [];
const autoStopOnFinish = input.autoStopOnFinish === true;

const out = {
  status: "ok",
  stopped: [],
};

if (autoStopOnFinish) {
  out.stopped = startedByRun;
}

process.stdout.write(`${JSON.stringify(out)}\n`);

