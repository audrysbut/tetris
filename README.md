# Tetris: Single-Player and 2P Multiplayer

- **Single player:** Play in the browser (no server required).
- **Multiplayer:** 2 players via **P2P WebRTC** (PeerJS). No server needed — the host creates a room, the guest joins with a 6-character code. Each player runs their own game engine locally and syncs state over a direct peer-to-peer data channel.

## Run locally

```bash
deno task dev    # Vite dev server on :4200
```

Open http://localhost:4200 → choose Single Player or Multiplayer.

### Production build

```bash
deno task build  # Outputs to apps/web/dist/
```

A `Dockerfile` is also available at `apps/web/` for containerized deployment (nginx serving the static build, port 80).
