# Tetris: Single-Player and 2P Multiplayer

- **Single player:** Play in the browser (no server required).
- **Multiplayer:** 2 players via RabbitMQ Web STOMP; winner = highest score when one tops out.

## Run locally

### Single player only

```bash
deno task dev:web
```

Open http://localhost:4200 → Single player.

### With multiplayer (API + RabbitMQ + UI)

```bash
docker compose up -d
```

Or with a rebuild: `docker compose up -d --build`

- **UI:** http://localhost:8080 (single-player and multiplayer)
- API: http://localhost:3000
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- **Web STOMP (browsers):** `ws://localhost:15674/ws` — use this URL in the frontend for STOMP over WebSocket.

### Dev (all apps)

```bash
deno task dev          # API + web (no RabbitMQ)
docker compose up -d rabbitmq   # start RabbitMQ for multiplayer
```

**Environment (optional):**

- **Web app:** `VITE_API_URL` – API base URL (default `http://localhost:3000`).  
  `VITE_RABBITMQ_WEB_STOMP_URL` – Web STOMP URL (default `ws://localhost:15674/ws`).
- **API:** `RABBITMQ_URL` – AMQP URL (default `amqp://guest:guest@localhost:5672`; use `amqp://guest:guest@rabbitmq:5672` in Docker).
