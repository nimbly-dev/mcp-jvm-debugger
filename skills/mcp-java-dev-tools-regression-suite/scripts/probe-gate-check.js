#!/usr/bin/env node
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const strict = input.probeVerification === true;
const probeOk = input.probeReachable === true;

const out =
  strict && !probeOk
    ? {
        status: "blocked",
        reasonCode: "probe_gate_failed",
        checks: ["probe=false"],
        nextAction: "Ensure probe endpoint is reachable, then rerun.",
      }
    : {
        status: "ok",
        reasonCode: "ok",
        checks: [`probe=${probeOk}`],
      };

process.stdout.write(`${JSON.stringify(out)}\n`);

