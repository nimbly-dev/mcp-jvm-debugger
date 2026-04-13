## Probe Recipe Inheritance Fixture Template

This fixture models inheritance delegation where the selected controller class has
zero local method bodies and inherits endpoint methods from a parent class in a
different module root.

- `child-module` contains `AppController` with no method bodies.
- `parent-module` contains `AbstractAppController` with inherited methods.

Integration tests materialize this template into a temporary workspace to verify
`probe_recipe_create` fail-closed guidance when `projectRootAbs` points only to
the child module.
