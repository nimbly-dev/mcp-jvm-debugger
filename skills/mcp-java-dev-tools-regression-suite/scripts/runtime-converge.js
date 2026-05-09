#!/usr/bin/env node
/*
Deterministic helper.
Input (stdin JSON):
{
  "autoStart": true|false,
  "apiReachable": true|false,
  "probeReachable": true|false
}
*/
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const out = {
  status: "ok",
  reasonCode: "ok",
  checks: [],
  nextAction: "",
};

if (input.autoStart === false) {
  if (!input.apiReachable || !input.probeReachable) {
    out.status = "blocked";
    out.reasonCode = "runtime_autostart_disabled_runtime_down";
    out.checks = [`api=${Boolean(input.apiReachable)}`, `probe=${Boolean(input.probeReachable)}`];
    out.nextAction = "Start runtime manually with probe wiring and rerun.";
  }
} else if (input.apiReachable && !input.probeReachable) {
  out.status = "auto_replace_now";
  out.reasonCode = "runtime_auto_replace_required";
  out.nextAction = "Auto-replace running process with probe-wired runtime context startup in this same run.";
}

process.stdout.write(`${JSON.stringify(out)}\n`);
