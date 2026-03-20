# Output Template

Use this report structure exactly.

```text
Issue Title

Issue Description

Observed Behavior
<short evidence-backed description>

Expected Behavior
<expected result or state "Not explicitly confirmed in session">

Steps to Reproduce
1. <sanitized trigger step>
2. <sanitized trigger step>
3. <observed failure>

Supporting Evidence
<short sanitized excerpts, probe facts, stack trace summary, or route details>

Impact
<developer-relevant impact or "Impact not fully established in session">

Sanitization Note
Class names, package names, enterprise identifiers, hosts, and credentials were anonymized or redacted.
```

## Writing Rules

1. Keep the title concise.
2. Keep the description to one short paragraph.
3. Keep evidence short and high signal.
4. Do not paste full logs unless the user explicitly asks for them.
5. If repro is partial, say so in `Steps to Reproduce` or `Supporting Evidence`.
