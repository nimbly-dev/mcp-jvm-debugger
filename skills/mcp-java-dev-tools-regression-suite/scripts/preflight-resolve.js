#!/usr/bin/env node
const fs = require("node:fs");

const input = JSON.parse(fs.readFileSync(0, "utf8"));
const missing = Array.isArray(input.requiredKeys)
  ? input.requiredKeys.filter((k) => !input.context || typeof input.context[k] === "undefined")
  : [];

const out =
  missing.length > 0
    ? {
        status: "needs_user_input",
        reasonCode: "needs_user_input",
        missing,
        checks: [],
        nextAction: `Provide ${missing[0]} and rerun.`,
      }
    : {
        status: "ok",
        reasonCode: "ok",
        missing: [],
        checks: [],
      };

process.stdout.write(`${JSON.stringify(out)}\n`);

