## Java Probe Agent

Runtime-only probe agent for local JVMs. No application source code changes required.

### Build

```powershell
mvn -f java-agent\pom.xml -DskipTests package
```

Built artifact:

```text
java-agent\target\mcp-jvm-probe-agent-0.1.0-all.jar
```

### Run With Spring Boot

Use JVM args (example):

```text
-javaagent:C:\Users\Altheo\repository\mcp-jvm-debugger\java-agent\target\mcp-jvm-probe-agent-0.1.0-all.jar=host=127.0.0.1;port=9191;mode=observe;actuatorId=none;include=com.nimbly.**;exclude=com.nimbly.mcpjvmdebugger.agent.**,**.config.**,**Test
```

`include` and `exclude` are comma-separated glob patterns over dotted class names.
- Agent mode defaults to `observe`.
- Supported modes:
  - `observe` (default): telemetry only, no runtime behavior mutation.
  - `actuate`: enables controlled runtime actuation flows.
- `actuatorId` is optional and only meaningful in `actuate` mode.
- Generic boolean actuator (actuate mode):
  - target key: `ClassName#methodName`
  - return value override: `true|false`
- If no wildcard is present, pattern is treated as package prefix.
- Runtime probe keys are dynamic: `fully.qualified.ClassName#methodName`.
- Line-level probe keys are also emitted: `fully.qualified.ClassName#methodName:<lineNumber>`.
  - Example: `com.nimbly.phshoesbackend.useraccount.core.service.impl.SuppressionServiceImpl#shouldBlock:32`
- In `mcp-jvm-debugger`, `projects_discover` can infer a default include glob from project packages.
- If `include` is omitted, the agent auto-infers base package at startup:
  - from executable jar manifest `Start-Class` (or `Main-Class`)
  - or from class-launch command (`java com.example.Main`)
  - then uses `<base.package>.**` as default include
- Defaults can be overridden without changing args:
  - `-Dmcp.probe.include=...` or env `MCP_PROBE_INCLUDE`
  - `-Dmcp.probe.exclude=...` or env `MCP_PROBE_EXCLUDE`
  - `-Dmcp.probe.mode=observe|actuate` or env `MCP_PROBE_MODE`
  - `-Dmcp.probe.actuator.id=<id>` or env `MCP_PROBE_ACTUATOR_ID`
  - `-Dmcp.probe.actuate.target=<Class#method>` or env `MCP_PROBE_ACTUATE_TARGET`
  - `-Dmcp.probe.actuate.return.boolean=true|false` or env `MCP_PROBE_ACTUATE_RETURN_BOOLEAN`

### Endpoints Exposed By Agent

- `GET /__probe/status?key=<probe-key>`
  - Example key: `com.nimbly.phshoesbackend.catalog.core.repository.jpa.CatalogShoeSpecifications#finalPriceGte`
  - Example line key: `com.nimbly.phshoesbackend.catalog.core.repository.jpa.CatalogShoeSpecifications#finalPriceGte:87`
  - Example response: `{ "key":"com.nimbly.phshoesbackend.catalog.core.repository.jpa.CatalogShoeSpecifications#finalPriceGte", "hitCount":1, "lastHitEpochMs":1739671200000, "mode":"observe", "actuatorId":"", "actuateTargetKey":"", "actuateReturnBoolean":false }`
- `POST /__probe/reset`
  - Body: `{ "key":"com.nimbly.phshoesbackend.catalog.core.repository.jpa.CatalogShoeSpecifications#finalPriceGte" }`
  - Line-key reset works the same way using `Class#method:<line>`.
