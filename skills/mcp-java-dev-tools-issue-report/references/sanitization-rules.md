# Sanitization Rules

Apply these rules to the final report.

## 1. Secret Redaction

Always remove or replace:

1. `Authorization` header values
2. bearer tokens
3. cookies and session identifiers
4. passwords and API keys
5. private credentials in URLs
6. signed URLs and opaque auth query parameters

Examples:

1. `Authorization: Bearer eyJ...` -> `Authorization: Bearer <REDACTED>`
2. `Cookie: JSESSIONID=...` -> `Cookie: <REDACTED>`

## 2. Company and Product Names

Replace enterprise names with neutral terms.

Examples:

1. company names -> `ExampleCompany`
2. product names -> `ExampleProduct`
3. client names -> `ClientA`

Do not remove the entire phrase if the technical meaning depends on it. Rewrite it neutrally.

## 3. Package Name Anonymization

Rewrite package roots to neutral namespaces while preserving layer and module shape.

Pattern:

1. `com.company.product.domain.web.controller` -> `com.example.domain.web.controller`
2. `com.company.internal.rules.engine` -> `com.example.rules.engine`

Keep useful layer markers such as:

1. `web`
2. `api`
3. `core`
4. `service`
5. `repository`
6. `security`
7. `config`
8. `infra`

## 4. Class Name Anonymization

Preserve technical role, remove proprietary stems.

Rules:

1. Drop company or product prefixes.
2. Keep suffixes like `Controller`, `Service`, `Repository`, `Mapper`, `Filter`, `Handler`, `Specification`, `Config`, `Client`, `DTO`.
3. Replace business-specific nouns with generic nouns when needed.

Examples:

1. `CompanyClassA` -> `ClassA`
2. `SynonymsRuleController` -> `RuleController`
3. `AcmeCatalogService` -> `CatalogService`
4. `EnterpriseTokenValidationFilter` -> `SecurityFilter`
5. `CatalogEntitySpecifications` -> `EntitySpecifications`

Prefer a meaningful generic alias over full redaction.

## 5. URL and Hostname Sanitization

Replace internal URLs and hosts with safe equivalents while keeping path structure when useful.

Examples:

1. `https://internal.company.local/api/v1/catalog` -> `https://internal-service/api/v1/catalog`
2. `catalog-dev.ap-southeast-1.internal` -> `internal-service`

Keep:

1. HTTP method
2. route pattern
3. query parameter names when they are not sensitive

## 6. Stable Alias Map

Use one alias consistently across the whole report.

If:

1. `SynonymsRuleController` becomes `RuleController`

Then:

1. use `RuleController` everywhere in the report
2. do not switch later to `ClassController` or `ControllerA`

## 7. Preserve Reproducibility

Sanitization must not destroy the ability to understand the issue.

Keep when safe:

1. exception type
2. HTTP method
3. route pattern
4. sequence of events
5. component role
6. line number
7. sanitized request shape

Remove or rewrite only the identifying parts.
