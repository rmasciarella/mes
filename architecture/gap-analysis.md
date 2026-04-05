# Gap Analysis: tsu-stack vs Explicit Architecture

**Date**: 2026-04-05
**Scope**: TypeScript monorepo (`packages/core`, `packages/db`, `packages/api`, `packages/auth`, `apps/server`, `apps/web`) measured against Herberto Graca's Explicit Architecture (Hexagonal/Onion/Clean/CQRS combined).

## Scope Limitations

This analysis covers technical migration options based on code structure analysis.
Complete migration planning requires additional business context:

- Budget constraints and approval processes
- Team capacity and skill availability
- Business timeline requirements
- Risk tolerance and compliance needs

These options should inform broader planning discussions, not replace them.

---

## Current State Summary

### Package Topology

```
tsu-stack/
  apps/
    server/          # Hono HTTP server, oRPC handlers, OpenAPI docs
    web/             # TanStack Start frontend (React, SSR)
  packages/
    core/            # Domain layer: entities, value objects, domain events, ports
    db/              # Drizzle ORM: schema, repositories (adapter implementations)
    api/             # oRPC routers, procedures, context factory
    auth/            # better-auth configuration
    env/             # Typed environment variables (t3-env)
    i18n/            # Paraglide i18n
    logger/          # LogTape logging
    ui/              # Shared UI components (Radix/shadcn)
  lib/
    ts-extension/    # Language-level utilities (branded types)
```

### What Already Aligns

| Concept                        | Current Implementation                                                            |
| ------------------------------ | --------------------------------------------------------------------------------- |
| **Domain entities**            | `core/src/iam/domain/user.entity.ts` - immutable type                             |
| **Value objects**              | `core/src/iam/domain/user-id.value-object.ts` - branded type                      |
| **Domain events**              | `core/src/iam/domain/events.ts` + `core/src/shared-kernel/events/domain-event.ts` |
| **Port interfaces**            | `core/src/iam/application/ports/user.repository.port.ts`                          |
| **Driven adapters**            | `db/src/repositories/iam/user.repository.ts` implements `UserRepositoryPort`      |
| **Dependency direction**       | `core` has zero runtime deps on `db`, `api`, `auth`, or `apps/*`                  |
| **Application queries**        | `core/src/iam/application/query/get-current-user.ts` with DI via function params  |
| **Shared kernel start**        | `core/src/shared-kernel/events/domain-event.ts`                                   |
| **Branded types**              | `lib/ts-extension/src/branded.ts` as language extension                           |
| **Package-by-component start** | IAM domain organized under `iam/` within `core` and `db`                          |

### Technology Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Runtime         | Node.js 24                                    |
| Language        | TypeScript 6                                  |
| Package manager | pnpm 10 (workspaces)                          |
| Toolchain       | Vite+ (Vite, Rolldown, Vitest, Oxlint, Oxfmt) |
| HTTP framework  | Hono                                          |
| RPC/API         | oRPC (RPC + OpenAPI)                          |
| Database        | PostgreSQL via Drizzle ORM                    |
| Auth            | better-auth                                   |
| Frontend        | TanStack Start (React 19, SSR)                |
| Logging         | LogTape                                       |

---

## Target State Summary

Based on Herberto Graca's Explicit Architecture, the target organizes code into:

1. **Application Core** (inner, no framework deps)
   - **Domain Layer**: Entities with behavior, Value Objects, Domain Services, Domain Events, Aggregates
   - **Application Layer**: Application Services (Command/Query handlers), Ports (interfaces), Application Events, DTOs
   - **Shared Kernel**: Cross-component shared types (events, IDs, enums)

2. **Infrastructure** (outer, implements driven ports)
   - Persistence adapters (repositories)
   - External service adapters
   - Framework configuration

3. **Presentation / Delivery** (outer, drives primary ports)
   - Controllers / Route handlers
   - CLI adapters
   - Web UI

4. **Dependency Rule**: All dependencies point inward. Outer layers depend on inner layers, never the reverse. Ports live inside the core; adapters live outside.

5. **Component Organization**: Code organized by bounded context (component), each containing its own domain/application/port layers.

6. **CQS/CQRS**: Commands mutate state; Queries return data. Separate read/write paths at the application layer.

7. **Event-Driven Decoupling**: Components communicate via domain/application events through the shared kernel, not direct references.

---

## Gap Inventory

| ID  | Gap                                                    | Type               | Complexity | Priority |
| --- | ------------------------------------------------------ | ------------------ | ---------- | -------- |
| G1  | Anemic domain model (no behavior on entities)          | Missing capability | Medium     | High     |
| G2  | No aggregate roots or aggregate boundaries             | Missing capability | High       | High     |
| G3  | No command handlers / command side separation          | Missing capability | Medium     | Medium   |
| G4  | No domain services                                     | Missing capability | Low        | Medium   |
| G5  | No event dispatcher implementation                     | Missing capability | Medium     | Medium   |
| G6  | API routers directly orchestrate use cases             | Architectural debt | Medium     | Medium   |
| G7  | Repository creates context singleton (no DI container) | Architectural debt | Medium     | Low      |
| G8  | Auth package tightly coupled to infrastructure         | Architectural debt | High       | Low      |
| G9  | No application events / event listeners                | Missing capability | Medium     | Medium   |
| G10 | Shared kernel incomplete (only DomainEvent base type)  | Missing capability | Low        | Low      |
| G11 | No architectural fitness tests                         | Missing capability | Low        | Medium   |
| G12 | `core` exports only shared-kernel from index.ts        | Structural gap     | Low        | Low      |

---

## Detailed Gap Analysis

### G1: Anemic Domain Model

#### Current State

`User` is a plain readonly type alias with no behavior:

```typescript
// packages/core/src/iam/domain/user.entity.ts
export type User = {
  readonly id: UserId;
  readonly email: string;
  // ...properties only
};
```

Domain logic (validation, state transitions, invariant enforcement) does not exist yet. The entity is purely a data carrier.

#### Target State

Entities should encapsulate business rules and behavior. In Explicit Architecture, "entities containing business data and logic" are the heart of the domain layer. Factory methods enforce creation invariants; methods enforce transition rules.

#### Technical Options

##### Option A: Rich Entity Classes

- **Approach**: Convert `User` to a class with private constructor, static factory `create()`, and behavior methods.
- **Pros**: Familiar OOP pattern, enforces invariants at construction, can emit domain events from within.
- **Cons**: Heavier, requires mapping between ORM rows and domain objects.
- **Technical complexity**: Medium
- **Dependencies**: G2 (aggregate boundaries define which entities get behavior)

##### Option B: Functional Domain Module

- **Approach**: Keep `User` as an immutable type. Add companion functions like `createUser(props): User`, `changeEmail(user, newEmail): User` that return new instances and validate invariants.
- **Pros**: Aligns with TypeScript/FP idiom, immutable by default, simpler serialization.
- **Cons**: Invariants must be enforced at every construction site unless factory is the only public creator.
- **Technical complexity**: Low-Medium
- **Dependencies**: None

#### Recommendation

Option B (functional domain module) fits the existing codebase style (already using function-based queries with DI via params). Start with the IAM component to establish the pattern.

#### Business Context Required

- Which domain rules need encoding first (e.g., email validation, name constraints)?
- Are there upcoming features that would benefit from richer domain modeling?

---

### G2: No Aggregate Roots or Aggregate Boundaries

#### Current State

No concept of aggregates. `User`, `Session`, `Account`, and `Verification` are all flat tables with foreign keys. There's no transactional boundary definition.

#### Target State

Aggregates define consistency boundaries. In Explicit Architecture, repositories load and persist entire aggregates. The aggregate root is the only entry point for mutations.

#### Technical Options

##### Option A: User as Aggregate Root

- **Approach**: Define `User` as the aggregate root for the IAM context. `Session` and `Account` become part of the `User` aggregate. Repository loads/saves the full aggregate.
- **Pros**: Clear consistency boundary, prevents partial updates.
- **Cons**: better-auth manages sessions/accounts directly at the DB level, creating tension with aggregate ownership.
- **Technical complexity**: High
- **Dependencies**: G8 (auth coupling)

##### Option B: Separate Auth Aggregate from Domain User

- **Approach**: Treat better-auth tables (session, account, verification) as infrastructure concerns. The domain `User` aggregate contains only business-relevant state (id, email, name, etc.). Auth tables are managed by the auth adapter outside domain boundaries.
- **Pros**: Clean separation, auth infra doesn't pollute domain model, pragmatic.
- **Cons**: User creation spans two concerns (domain + auth), requiring coordination.
- **Technical complexity**: Medium
- **Dependencies**: None

#### Recommendation

Option B. better-auth owns the auth tables. The domain `User` aggregate contains only business state. A domain event (`UserRegistered`) can coordinate downstream side effects.

---

### G3: No Command/Query Separation at Application Layer

#### Current State

Only a single query handler exists (`getCurrentUser`). There are no command handlers. The API router directly calls the query handler:

```typescript
// packages/api/src/routers/iam/index.ts
.handler(async ({ context }) => {
  const user = await getCurrentUser(
    { userRepo: context.repos.user },
    { userId: context.session.user.id as UserId },
  );
```

#### Target State

Application layer has explicit Command handlers (mutate state) and Query handlers (read state). CQS principle: commands don't return data, queries don't mutate state.

#### Technical Options

##### Option A: Function-Based Commands/Queries (Extend Current Pattern)

- **Approach**: Continue the existing pattern of `async function commandName(deps, input)`. Organize under `application/command/` and `application/query/` directories per component.
- **Pros**: Already started with queries, minimal new abstractions, explicit dependency injection.
- **Cons**: No automatic cross-cutting concerns (logging, transactions) without additional wiring.
- **Technical complexity**: Low
- **Dependencies**: None

##### Option B: Command/Query Bus

- **Approach**: Introduce a bus abstraction that routes command/query objects to handlers. Enables middleware (logging, transactions, validation).
- **Pros**: Decouples router from handler, enables cross-cutting concerns.
- **Cons**: Over-engineered for current scale, adds indirection.
- **Technical complexity**: Medium-High
- **Dependencies**: None

#### Recommendation

Option A. The function-based pattern already works well. Add command functions following the same `(deps, input) => Promise<void>` convention. A bus can be introduced later if cross-cutting concerns become a problem.

---

### G4: No Domain Services

#### Current State

No domain services exist. The only business logic is the `getCurrentUser` query which delegates to a repository.

#### Target State

Domain services encapsulate business logic that spans multiple entities or doesn't naturally belong to a single entity.

#### Technical Options

##### Option A: Add When Needed

- **Approach**: Don't create domain services preemptively. Add them when business logic genuinely spans multiple entities.
- **Pros**: Avoids speculative abstraction, YAGNI.
- **Cons**: None at current scale.
- **Technical complexity**: Low
- **Dependencies**: G1 (behavior needs to exist before cross-entity logic does)

#### Recommendation

Option A. This gap is expected at the current stage. Domain services should emerge from real business needs, not architectural completeness.

---

### G5: No Event Dispatcher Implementation

#### Current State

`EventDispatcherPort` exists as a port interface. `DomainEvent` base type and `UserRegistered` event type are defined. But there is no concrete implementation and no wiring.

```typescript
// packages/core/src/port/event-dispatcher.port.ts
export type EventDispatcherPort = {
  dispatch(event: DomainEvent): void | Promise<void>;
};
```

#### Target State

A working event dispatcher that domain/application code can use to publish events, with listeners that react to them. This enables component decoupling per Explicit Architecture.

#### Technical Options

##### Option A: In-Process Event Emitter

- **Approach**: Implement `EventDispatcherPort` with a simple in-process pub/sub. Register handlers at startup. Place implementation in `packages/core/src/shared-kernel/` or a new `packages/events/` infrastructure package.
- **Pros**: Simple, testable, no external dependencies. Sufficient for monolith.
- **Cons**: No durability, no retry. Events lost if process crashes.
- **Technical complexity**: Low
- **Dependencies**: None

##### Option B: Infrastructure-Level Event Bus

- **Approach**: Implement dispatcher using an external message broker (e.g., Redis Pub/Sub, NATS).
- **Pros**: Durable, supports microservice extraction later.
- **Cons**: Operational overhead, premature for current scale.
- **Technical complexity**: High
- **Dependencies**: External infrastructure

#### Recommendation

Option A. Start with an in-process dispatcher. The port already exists, so the adapter is swappable. Move to infrastructure-level messaging when the system demands it.

---

### G6: API Routers Directly Orchestrate Use Cases

#### Current State

The oRPC router handler directly calls into application queries and constructs the response:

```typescript
// packages/api/src/routers/iam/index.ts
.handler(async ({ context }) => {
  const user = await getCurrentUser(
    { userRepo: context.repos.user },
    { userId: context.session.user.id as UserId },
  );
  return { message: "This is private", user };
});
```

In Explicit Architecture terms, the router is acting as both the **driving adapter** (translating HTTP to application calls) AND doing lightweight orchestration (response shaping).

#### Target State

Routers should be thin driving adapters that translate delivery mechanism input into application service/handler calls. Response shaping belongs in the application layer or a dedicated presenter/DTO mapper.

#### Technical Options

##### Option A: Extract Response Mapping to Application Layer

- **Approach**: Have command/query handlers return domain types. Add a thin mapping layer (DTOs or response types) at the application boundary.
- **Pros**: Cleaner separation, testable without HTTP framework.
- **Cons**: Extra mapping boilerplate for simple cases.
- **Technical complexity**: Low
- **Dependencies**: G3

##### Option B: Keep Current Pattern, Enforce Thinness

- **Approach**: Accept that oRPC handlers are the driving adapter. Enforce that they only call one application function and do minimal mapping.
- **Pros**: Pragmatic, minimal change.
- **Cons**: Router stays coupled to response shape.
- **Technical complexity**: None
- **Dependencies**: None

#### Recommendation

Option B for now, graduating to Option A as the application layer grows. The current handler is already quite thin.

---

### G7: Repository Instantiation Without DI Container

#### Current State

The API context factory directly instantiates `UserRepository`:

```typescript
// packages/api/src/context.ts
repos: {
  user: new UserRepository(),
},
```

`UserRepository` internally imports the `db` singleton. There's no DI container or explicit wiring.

#### Target State

Adapters (repositories) are injected into the application core through ports. The wiring happens at the composition root (server startup), not inside the application layer.

#### Technical Options

##### Option A: Manual Composition Root

- **Approach**: Wire dependencies explicitly at server startup. Pass `db` instance to `UserRepository` constructor. Context factory receives pre-built repos.
- **Pros**: Explicit, no framework dependency, testable with test doubles.
- **Cons**: Verbose as dependency graph grows.
- **Technical complexity**: Low
- **Dependencies**: None

##### Option B: Lightweight DI Container

- **Approach**: Use a TS DI library (e.g., tsyringe, inversify, or a simple factory map).
- **Pros**: Scales better, automatic resolution.
- **Cons**: Additional dependency, magic, harder to trace.
- **Technical complexity**: Medium
- **Dependencies**: None

#### Recommendation

Option A. Manual composition root at `apps/server/src/index.ts`. Pass `db` into repository constructors. This keeps wiring explicit and avoids DI framework overhead at current scale.

---

### G8: Auth Package Tightly Coupled to Infrastructure

#### Current State

`packages/auth/src/index.ts` directly imports `@tsu-stack/db` and `@tsu-stack/env`, configures better-auth with Drizzle adapter, cookie settings, and plugins. It's a pure infrastructure/configuration package with no port abstraction.

#### Target State

In Explicit Architecture, authentication would be a secondary (driven) adapter implementing an auth port defined in the core. The core would define what it needs from auth (e.g., `AuthPort { getSession(headers): Session }`) and the auth package would implement it.

#### Technical Options

##### Option A: Extract Auth Port

- **Approach**: Define `AuthPort` in `core`. Have `packages/auth` implement it. The API context depends on the port, not the concrete auth.
- **Pros**: Core becomes truly independent of better-auth.
- **Cons**: better-auth handles HTTP routes directly (`/auth/*`), making full abstraction impractical.
- **Technical complexity**: High
- **Dependencies**: None

##### Option B: Accept Auth as Infrastructure Boundary

- **Approach**: Treat better-auth as an infrastructure concern that sits outside the domain. The domain only knows about `User` entities. Auth-to-domain translation happens in the API context factory.
- **Pros**: Pragmatic, matches reality (auth libraries are inherently infrastructure).
- **Cons**: Auth config stays coupled to concrete implementation.
- **Technical complexity**: None (already the case)
- **Dependencies**: None

#### Recommendation

Option B. Authentication libraries are inherently infrastructure. The current boundary is reasonable. If auth ever needs swapping, extract the port then.

---

### G9: No Application Events / Event Listeners

#### Current State

Domain event types exist (`UserRegistered`) but are never dispatched or listened to. There's no application event concept.

#### Target State

Application events represent use case outcomes that trigger side effects (send email, update cache, notify other components). Listeners are registered at the composition root.

#### Technical Options

##### Option A: Implement Alongside Event Dispatcher (G5)

- **Approach**: When implementing the event dispatcher, also add application event types and listener registration.
- **Pros**: Natural pairing, avoids partial implementation.
- **Cons**: Requires G5 first.
- **Technical complexity**: Low (incremental on top of G5)
- **Dependencies**: G5

#### Recommendation

Address together with G5. Define application events in the application layer, register listeners at the composition root.

---

### G10: Shared Kernel Incomplete

#### Current State

Only `DomainEvent<T, P>` base type lives in `core/src/shared-kernel/`. The `UserRegistered` event type lives in the IAM component, not in the shared kernel.

#### Target State

Shared kernel contains types that enable cross-component communication: event definitions, shared value object types (e.g., `UserId`), enums. It should be "completely decoupled from the remainder of the codebase."

#### Technical Options

##### Option A: Expand Shared Kernel Gradually

- **Approach**: Move cross-component types (IDs, event base types, shared enums) into `core/src/shared-kernel/`. Keep component-specific events within their components.
- **Pros**: Incremental, only shared what's actually shared.
- **Cons**: Boundary between "shared" and "component-specific" requires judgment.
- **Technical complexity**: Low
- **Dependencies**: None

#### Recommendation

Option A. As new components emerge, promote types to the shared kernel only when they're actually referenced across components.

---

### G11: No Architectural Fitness Tests

#### Current State

No automated tests verify that dependency rules are respected (e.g., that `core` never imports from `db` or `api`).

#### Target State

Automated tests (like PHP's Deptrac in Graca's repo) enforce: (1) layer integrity (deps point inward), (2) component integrity (components don't cross-reference), (3) class-level rules.

#### Technical Options

##### Option A: Import Linting Rules

- **Approach**: Use Oxlint or ESLint import restriction rules to enforce that `@tsu-stack/core` never imports from `@tsu-stack/db`, `@tsu-stack/api`, etc.
- **Pros**: Runs as part of existing `vp check`, fast, CI-friendly.
- **Cons**: Limited to import-level checks, can't verify runtime behavior.
- **Technical complexity**: Low
- **Dependencies**: None

##### Option B: Custom Vitest Architecture Tests

- **Approach**: Write Vitest tests that analyze the dependency graph (e.g., parse `package.json` dependencies, scan imports).
- **Pros**: Flexible, can enforce arbitrary rules.
- **Cons**: Custom test infrastructure to maintain.
- **Technical complexity**: Medium
- **Dependencies**: None

#### Recommendation

Option A first (lint rules are cheapest). Supplement with Option B tests for rules that lint can't express.

---

### G12: Core Package Index Export Gap

#### Current State

`packages/core/src/index.ts` only exports the shared kernel:

```typescript
export * from "#@/shared-kernel/events/domain-event";
```

Component-level exports (IAM entities, ports, events) are accessed via deep imports (`@tsu-stack/core/iam/...`).

#### Target State

This is actually fine. Deep imports via the `exports` field in `package.json` (`"./*": "./src/*.ts"`) allow consumers to import specific modules without barrel files. This matches the component-by-component access pattern.

#### Recommendation

No change needed. The current approach avoids barrel file bloat and enables tree-shaking.

---

## Technical Dependencies

```
G5 (Event Dispatcher) ──> G9 (Application Events)
G1 (Rich Domain)      ──> G2 (Aggregates) ──> G4 (Domain Services)
G3 (CQS Separation)   ──> G6 (Thin Routers)
```

G7 (DI/Composition Root), G8 (Auth Boundary), G10 (Shared Kernel), G11 (Fitness Tests) are independent.

## Recommended Sequencing

**Phase 1 - Foundation** (independent, can be parallel):

1. **G11**: Add architectural fitness tests (lint rules) to lock in current good dependency direction
2. **G3**: Establish command handler pattern alongside existing queries
3. **G7**: Refactor repository instantiation to explicit composition root

**Phase 2 - Domain Enrichment**: 4. **G1**: Add behavior to domain entities (start with IAM User) 5. **G5 + G9**: Implement event dispatcher + application event listeners 6. **G10**: Expand shared kernel as new components emerge

**Phase 3 - Refinement** (as system grows): 7. **G2**: Define aggregate boundaries when multiple entities per context exist 8. **G4**: Add domain services when cross-entity logic emerges 9. **G6**: Extract response mapping when routers become complex

**Deferred**:

- **G8**: Auth port extraction - only if switching auth providers becomes likely

## Business Decisions Required

- **Domain complexity trajectory**: Is the system expected to grow significantly in domain logic, or will it remain mostly CRUD? This determines urgency of G1, G2, G4.
- **Multi-team development**: Will multiple teams work on different bounded contexts? This increases priority of G10, G11.
- **Event-driven requirements**: Are there features requiring side effects on user actions (email, notifications, audit)? This determines priority of G5, G9.
