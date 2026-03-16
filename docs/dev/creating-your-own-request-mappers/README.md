Creating a Request Mapper Adapter

This guide walks you through teaching the Java agent how a framework expresses HTTP routes. You'll build an adapter that extracts route information from source code annotations.

Core Principle

Your adapter answers one question: Can I prove the HTTP method and path for this method from source evidence alone?

• If yes → return a normalized ResolvedMapping
• If no → return Optional.empty() and let the pipeline fail closed

This isn't about guessing routes. It's about extracting them only when the evidence is unambiguous.

Getting Started

Copy the example module as your starting point:

``
java-agent/mappers-adapters/adapter-request-mapper-example
`

This example is disabled by default and safe to modify. It demonstrates the complete extraction pattern:

• Annotation name mapping
• Class + method path merging
• HTTP method resolution
• Path expression resolution (literals, constants, concatenation)
• Final materialization through PathMaterializer

Place your implementation in:

`
java-agent/mappers-adapters/adapter-request-mapper-<framework>
`

For example: adapter-request-mapper-jaxrs, adapter-request-mapper-quarkus

Implementation Checklist
Copy the example module; rename package and artifact names
Replace annotation constants with your framework's route annotations
Implement class-level base path extraction
Implement method-level path and verb extraction
Reuse PathMaterializer for consistent template handling
Register your extractor in META-INF/services
Build the module standalone before wiring it into the aggregator

Design Guidelines

| Do | Don't |
|---|---|
| Keep strategyId() stable and specific | Put framework-specific code in core-request-mapper |
| Treat composed annotations (@Get, @Post) as first-class | Return a mapping when only part of the route is proven |
| Support both path and value attributes when the framework uses both | Rely on naming conventions instead of annotation evidence |
| Handle constant references and string concatenation | Convert unresolved expressions into fake paths |
| Return Optional.empty() for ambiguous cases | Bypass ServiceLoader registration |

When to Fail Closed

Return Optional.empty() when:

• No route annotations match
• HTTP method cannot be resolved
• Path expression requires unsafe assumptions to resolve

Returning empty is correct behavior. Silent invention of routes is not.

Building and Validating

Build your module in isolation first:

`bash
mvn -f java-agent/mappers-adapters/adapter-request-mapper-<framework>/pom.xml test
`

Then build the full stack:

`bash
mvn -f java-agent/pom.xml test
`

After wiring, validate end-to-end through the recipe/probe flow to confirm the mapper output works in orchestrated execution.

Definition of Done
• [ ] Adapter compiles and loads via ServiceLoader
• [ ] Proven routes resolve to deterministic ResolvedMapping` objects
• [ ] Unproven routes fail closed—no pseudo-success output
• [ ] Behavior is documented well enough for the next contributor to extend

The Sanity Check

Before calling it done, ask yourself:

> If extraction fails, does the system still provide a clear next step without pretending success?

If yes, your adapter is aligned with project intent.

Summary of Changes

Structure and scannability
• Added horizontal rules between major sections
• Converted guidelines into a comparison table
• Used a checklist for implementation steps and definition of done
• Shortened paragraphs and tightened sentences throughout

Tone
• Shifted from imperative commands to collaborative guidance ("You'll build..." instead of "Your job is...")
• Kept the direct, no-nonsense voice but softened the edges for contributors

Clarity
• Moved the core principle to the top so readers understand the mindset before the mechanics
• Grouped related concepts (when to fail closed, design do's and don'ts)
• Made the sanity check a blockquote to set it apart as a reflection prompt