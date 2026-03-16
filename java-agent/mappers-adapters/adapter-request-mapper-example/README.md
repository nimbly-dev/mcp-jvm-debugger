# Example Request Mapper Adapter (Opt-In)

This module is a practical starter adapter for framework adoptors.

## Important

- This module is example-only.
- It is **not** included in `java-agent/pom.xml` default modules.
- It is **not** active unless explicitly added to your aggregator and build.

## What This Example Actually Covers

The extractor is intentionally generic but complete enough to copy:

- class-level route resolution (`@ExampleController` or `@ExampleRoute`)
- method-level route resolution (`@ExampleRoute`)
- verb-specific mappings (`@ExampleGet`, `@ExamplePost`)
- path/value expression handling:
  - string literals
  - constants from the same class
  - constants referenced from another class
  - string concatenation
- HTTP materialization through `PathMaterializer`
- SPI registration through `META-INF/services`

## Strategy Id

- `java_ast_example_annotation_router`

## Example Framework Surface Included

The module ships a tiny sample framework and controller so adoptors can see a full flow:

- `exampleframework/annotations/*`
- `exampleframework/sample/ExampleCatalogController.java`

The sample also includes `PathVariable`, `RequestParam`, and `RequestBody` annotation names so query/path/body template generation works with the core parameter resolver naming rules.

## Manual Build (Optional)

```bash
mvn -f java-agent/mappers-adapters/adapter-request-mapper-example/pom.xml test
```

## How Adoptors Should Use This

1. Copy this module.
2. Rename package, artifactId, and strategy id.
3. Replace `ExampleAnnotationNames` with your framework annotation map.
4. Replace `ExampleMappingMerger` rules with your framework merge semantics.
5. Keep fail-closed behavior (`Optional.empty()` when not proven).

## First 60 Minutes Plan

If you are starting from scratch, this sequence usually works:

1. Map only class-level and method-level route annotations.
2. Add verb extraction (`GET/POST/...`) next.
3. Validate one controller with one happy path.
4. Add edge cases:
   constant paths, concatenated paths, and mixed annotation forms.
5. Add final coverage for unresolved expressions to ensure fail-closed output.

## Next Step To Productize

Move your real adapter to `java-agent/mappers-adapters/adapter-request-mapper-<framework>`,
register it in `java-agent/mappers-adapters/pom.xml`, and add module-level plus contract tests.
