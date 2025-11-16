<!--
Sync Impact Report
Version change: 0.0.0 → 1.0.0
Modified principles:
- Template Principle 1 → Readability-First Delivery
- Template Principle 2 → Review-Gated Planning
- Template Principle 3 → Layered Testing & Fragmented E2E
- Template Principle 4 → TypeScript & Tooling Discipline
- Template Principle 5 → Nanopass-Safe Transformations
Added sections:
- Scope & Platform Constraints
- Development Workflow & Quality Gates
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# SchemaStore PKL Constitution

## Core Principles

### Readability-First Delivery

Readability outranks correctness and performance for every artifact. A change MUST NOT merge if it reduces comprehension, even if it fixes bugs or speeds up the build.

- Design docs, code, and tests MUST explicitly explain intent and trade-offs; unclear optimizations are reverted until documented.
- Prefer small, explicit functions and linear control flow. When in doubt, split work so reviewers can manually reason about it within minutes.
- Performance tuning only begins after readability goals are satisfied and recorded in the spec/plan notes.

### Review-Gated Planning

Nothing ships without prior agreement on the story to tell.

- Every feature starts with a design doc that captures the minimal viable outcome and proposes nanopass boundaries; implementation begins only after that doc is reviewed.
- Tasks MUST be scoped so a human can fully review them in one sitting (roughly ≤300 LOC touched, single concern).
- Test plans (unit focus areas + E2E fragments) are drafted and approved immediately after the design doc review and before writing executable code.

### Layered Testing & Fragmented E2E

Testing resources focus on what matters most.

- Unit tests are reserved for core algorithms or state-machine steps where logic is non-trivial; boilerplate code relies on higher-level validation.
- E2E coverage is assembled from many small, independently runnable fragments, with exactly 1–2 real-world end-to-end journeys added last as regression sentinels.
- Tests are written first, reviewed, and intentionally fail before implementation (Red → Green → Refactor). Feature work halts until the minimal fragment suite passes.

### TypeScript & Tooling Discipline

TypeScript is the source of truth.

- All public and internal surfaces MUST carry explicit, precise TypeScript types—`any`, implicit return types, or untyped parameters are prohibited.
- The codebase targets Node.js 22 LTS plus TypeScript 5.9 strict features (`noUncheckedSideEffectImports`, `strictBuiltinIteratorReturn`, `rewriteRelativeImportExtensions`).
- Every PR MUST pass `hk check`, `pnpm run check`, and type-level diagnostics before review sign-off. Toolchain drift beyond the documented versions requires a governance amendment.

### Nanopass-Safe Transformations

AST/IR work follows nanopass principles to keep reasoning local.

- Each pass addresses exactly one concern (e.g., desugaring enums, normalizing schemas). Combining concerns in a single pass violates this principle.
- In Debug Profile, every pass MUST validate input artifacts before the transformation and validate that outputs remain lawful afterwards.
- Pass boundaries, invariants, and validation hooks are captured in both the design doc and the associated test plan before implementation.

## Scope & Platform Constraints

- The toolchain does **not** integrate with schema catalogs of any kind. Every workflow starts from an explicit schema URL or inline schema payload, and no catalog-specific adapters may be introduced.
- Transformations must treat schemas purely by their provided content; do not rely on catalog metadata, curated registries, or out-of-band conventions.
- Node.js 22 + TypeScript 5.9 is the baseline; deviations require explicit approval plus a migration plan documented in design docs.
- Readability-first thinking applies to docs, CLIs, and generated PKL packages—prefer clearer structure even if it duplicates a small amount of code.

## Development Workflow & Quality Gates

1. Draft the design doc and obtain approval (Principle: Review-Gated Planning).
2. Produce the detailed test plan (unit focus + E2E fragments + final journeys) and secure approval before any implementation begins.
3. Split the effort into reviewer-friendly tasks (≤300 LOC, single concern) and schedule them so MVP functionality lands first.
4. Write tests, watch them fail, implement the smallest slice that makes them pass, and run `hk check` plus `pnpm run check` at every checkpoint.
5. After the MVP slice is validated in isolation, extend functionality incrementally, keeping readability guardrails and the nanopass validations intact.

## Governance

- This constitution supersedes conflicting documentation. Exceptions require a written amendment proposal describing the trade-offs, updated design/test artifacts, and reviewer sign-off.
- Versioning follows semantic rules: MAJOR for breaking/removing principles, MINOR for new principles/sections or expanded scope, PATCH for clarifications.
- Ratified governance changes update both the constitution and downstream templates (plan/spec/tasks) in the same PR, and the Sync Impact Report must summarize the blast radius.
- Compliance reviews verify: readability-first adherence, approved design/test plans, strict TypeScript typing, nanopass validation hooks, generalizable scope, and successful `hk check` output attached to the PR.

**Version**: 1.0.0 | **Ratified**: 2025-11-15 | **Last Amended**: 2025-11-15
