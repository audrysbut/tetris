# Tetris — Agent guide

## Project structure

Deno workspace monorepo (`deno.json` at root):

```
apps/web/     — Preact SPA (Vite, aliased as React via `preact/compat`)
apps/api/     — NestJS 11 multiplayer server (Express, RabbitMQ/AMQP)
packages/shared/  — Board types, piece logic, game engine (shared by both apps)
```

## Commands

```sh
deno task web:dev          # Vite dev server on :4200 — single-player only
deno task api:dev          # NestJS API on :3000 (needs RabbitMQ for multiplayer)
deno task dev              # Both API + web (no RabbitMQ — starts it in Docker first)
docker compose up -d       # Full stack: RabbitMQ + API + web (web on :8080)
VITE_API_URL=... VITE_RABBITMQ_WEB_STOMP_URL=... deno task web:dev  # override defaults
```

- Web app builds via: `deno task --cwd apps/web build` (runs `node ./node_modules/vite/bin/vite.js build`)
- API runs via: `deno run --watch -A main.ts` (from `apps/api/`)

## Key architecture notes

- **Gamepad button indices** are mapped in `apps/web/src/game/gamepad.constants.ts` using Xbox-style named constants (`BUTTON_A`, `BUTTON_RB`, `BUTTON_DPAD_LEFT`, etc.). Always import from this file; never use raw numeric indices.
- **Input actions** are typed as `KeyAction` (`"left" | "right" | "rotate" | "softDrop" | "hardDrop" | "pause"`) in `apps/web/src/game/useKeyboard.ts` — both keyboard and gamepad hooks produce this same type.
- **Web app uses Preact**, not React, via Vite aliases (`react` → `preact/compat`). Imports use `from "react"` etc. (Preact compat layer).
- **API needs `experimentalDecorators` + `emitDecoratorMetadata`** in tsconfig — these are set in `apps/api/deno.json`.
- **No test framework, no CI workflows** — the build step is the only verification.

## Env vars

| Variable | Default | Used by |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Web (API base) |
| `VITE_RABBITMQ_WEB_STOMP_URL` | `ws://localhost:15674/ws` | Web (Web STOMP) |
| `RABBITMQ_URL` | `amqp://guest:guest@localhost:5672` | API (AMQP) |

## Ports

| Service | Port |
|---|---|
| Vite dev server | 4200 |
| API (NestJS) | 3000 |
| RabbitMQ AMQP | 5672 |
| RabbitMQ Management | 15672 |
| RabbitMQ Web STOMP | 15674 |
| Docker web (nginx) | 8080 |
