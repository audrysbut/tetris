# Tetris — Agent guide

## Project structure

Deno workspace monorepo (`deno.json` at root):

```
apps/web/     — Preact SPA (Vite, aliased as React via `preact/compat`)
  src/shared/ — Board types, piece logic, game engine
```

## Commands

```sh
deno task dev    # Vite dev server on :4200 — single-player + P2P multiplayer
deno task build  # Production build
```

- Web app builds via: `deno task --cwd apps/web build` (runs `node ./node_modules/vite/bin/vite.js build`)

## Key architecture notes

- **Multiplayer is P2P via WebRTC** — no server, no RabbitMQ. Uses `PeerJS` (v1.x) with the free cloud signaling server at `0.peerjs.com`. No infrastructure needed.
- **Matchmaking**: Host creates a room via `usePeerConnection().createRoom()` — a 6-character alphanumeric room code is generated and displayed. The guest joins by entering the code via `joinRoom(code)`. PeerJS handles signaling and NAT traversal automatically.
- **Game state sync**: Each player runs the game engine **locally** for their own board (mirroring the single-player loop in `useSinglePlayer.ts`). After every action or gravity tick, each player sends their `PlayerStateUpdate` to the opponent over a WebRTC `DataChannel`. The opponent renders the received state on the adjacent board. Both peers are symmetric — no host advantage, no guest latency.
- **Peer connection lifecycle**: Managed by `usePeerConnection.ts`. Exposes `send()` and `onData()` for bidirectional messaging. The `useMultiPlayer.ts` hook wraps the game loop + sync logic, consuming the peer connection.
- **Gamepad button indices** are mapped in `apps/web/src/game/gamepad.constants.ts` using Xbox-style named constants (`BUTTON_A`, `BUTTON_RB`, `BUTTON_DPAD_LEFT`, etc.). Always import from this file; never use raw numeric indices.
- **Input actions** are typed as `KeyAction` (`"left" | "right" | "rotate" | "softDrop" | "hardDrop" | "pause"`) in `apps/web/src/game/useKeyboard.ts` — both keyboard and gamepad hooks produce this same type.
- **Web app uses Preact**, not React, via Vite aliases (`react` → `preact/compat`). Imports use `from "react"` etc. (Preact compat layer).
- **No test framework, no CI workflows** — the build step is the only verification.

## Ports

| Service | Port |
|---|---|
| Vite dev server | 4200 |
