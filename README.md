# tax-inspection

An [Nx](https://nx.dev) monorepo with two applications:

| Project         | Stack                              | Location             |
| --------------- | ---------------------------------- | -------------------- |
| `inspector-web` | Angular 22 (standalone, SCSS)      | `apps/inspector-web` |
| `inspector-api` | Hono + `@hono/node-server` (Node)  | `apps/inspector-api` |
| `shared`        | Framework-agnostic TypeScript lib  | `libs/shared`        |

## Shared library

Code used by **both** apps lives in `libs/shared` and is imported through the
`@tax-inspection/shared` alias (defined in `tsconfig.base.json`):

```ts
import { formatCurrency, INSPECTION_STATUS_LABELS, type Inspection } from '@tax-inspection/shared';
```

Structure:

```
libs/shared/src/lib/
├── models/       # shared types & interfaces (Inspection, Taxpayer, ApiResponse, …)
├── constants/    # shared constants (API_PREFIX, status labels, …)
└── utils/        # shared helpers (formatCurrency, isDefined, nowIso, …)
```

Everything is re-exported from `libs/shared/src/index.ts`, so consumers only
import from `@tax-inspection/shared`. No build step is needed — each app compiles
the shared source directly.

## Prerequisites

- Node.js (v22+)
- npm

> **Note:** This workspace ships a local `.npmrc` with `legacy-peer-deps=true`
> to work around an npm 10.9 dependency-resolution bug in the Angular/Nx tree.
> Keep it — installs will fail without it.

## Install

```bash
npm install
```

## Develop

Run both apps together:

```bash
npm run dev
```

Or individually:

```bash
npm run dev:web   # Angular dev server → http://localhost:4200
npm run dev:api   # Hono server        → http://localhost:3000
```

The web dev server proxies `/api/*` to the API
(see `apps/inspector-web/proxy.conf.json`), so from the browser you can call
`/api/health` and it reaches the Hono server.

## Backend routes

| Method | Path                 | Response                          |
| ------ | -------------------- | --------------------------------- |
| GET    | `/`                  | Plain-text banner                 |
| GET    | `/api/health`        | `{ status, service, timestamp }`  |
| GET    | `/api/hello?name=`   | `{ message }`                     |
| GET    | `/api/inspections`   | `Inspection[]` (shared model)     |

Change the port with the `PORT` env var (defaults to `3000`).

## UI components — spartan/ui

`inspector-web` uses [spartan/ui](https://spartan.ng) (Tailwind CSS v4 + the
`@spartan-ng/brain` primitives). The "helm" components are **copied into the repo**
(you own them) as small Nx libraries under `libs/ui/*`, imported via the
`@spartan-ng/helm/*` alias:

```ts
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
```

Installed so far: `button`, `card`, `input`, `label` (+ shared `libs/ui/utils`).
Add more with:

```bash
npx nx g @spartan-ng/cli:ui <name>   # e.g. dialog, select, table
```

Tailwind is wired via `.postcssrc.json` (`@tailwindcss/postcss`) and
`apps/inspector-web/src/styles.scss` (theme = slate, plus `@source` directives so
Tailwind scans `libs/ui`). Config lives in `components.json`.

## State management — NgRx Signals

State uses the [NgRx SignalStore](https://ngrx.io/guide/signals) with the
**entities** plugin (`@ngrx/signals/entities`) and `@ngrx/operators`.

Each store is split into two files under `store/`:

- `<entity>.events.ts` — event groups (UI events + API events) via `eventGroup`.
- `<entity>.store.ts` — a `signalStore` with `withEntities<Inspection>()`,
  computed selectors, `withReducer(on(...))` for event-driven state transitions,
  and a `withHooks` effect that listens for UI events, calls the service, and
  dispatches API events (`mapResponse` from `@ngrx/operators`).

Components dispatch events (they don't call methods directly):

```ts
const dispatch = injectDispatch(inspectionsPageEvents);
dispatch.opened();      // triggers the load effect → reducer updates state
dispatch.removed(id);   // entity mutation via reducer
store.total();          // computed signal
```

## Folder structure

**`inspector-web`** (`apps/inspector-web/src/app`)

```
feature/        # one folder per feature/page (routed, lazy-loaded)
components/     # shared/reusable presentational components
service/        # logic + API calls (HttpClient)
interceptors/   # HTTP interceptors
guard/          # route guards
constants/      # sharable constant values
store/          # state management — <entity>.events.ts + <entity>.store.ts
```

**`inspector-api`** (`apps/inspector-api/src`)

```
api/<entity>/   # controller (actions) + routes (actions) + service (logic)
middleware/     # Hono middleware (error handler, request id, …)
utils/          # helpers (env, …)
main.ts         # composes middleware + mounts entity routes
```

Add a new backend entity by creating `api/<entity>/{<entity>.service.ts,
<entity>.controller.ts, <entity>.routes.ts}` and mounting it in `main.ts` with
`app.route(...)`.

## Build

```bash
npm run build       # both apps → dist/apps/*
npm run build:web
npm run build:api
```

## Useful Nx commands

```bash
npx nx graph                       # visualize the project graph
npx nx show projects               # list all projects
npx nx run-many -t build           # build everything
```
