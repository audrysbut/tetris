import { Injectable } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service.ts";
import { GameRoomService } from "./game-room.service.ts";

interface ActionPayload {
  matchId: string;
  playerId: 1 | 2;
  type: string;
  dir?: string;
}

@Injectable()
export class GameConsumerService {
  private activeConsumers = new Set<string>();
  private gravityIntervals = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly room: GameRoomService
  ) {}

  private stopGravity(matchId: string): void {
    const id = this.gravityIntervals.get(matchId);
    if (id != null) {
      clearInterval(id);
      this.gravityIntervals.delete(matchId);
    }
  }

  /** Start consuming actions for a match (call when game starts) */
  startConsuming(matchId: string): void {
    if (this.activeConsumers.has(matchId)) return;
    this.activeConsumers.add(matchId);

    const dropMs = this.room.getDropIntervalMs();
    const gravityId = setInterval(() => {
      const r = this.room.getRoom(matchId);
      if (!r || r.status === "finished") {
        this.stopGravity(matchId);
        return;
      }
      const room = this.room.tickGravity(matchId);
      if (room) {
        this.rabbit.publishUpdate(matchId, this.room.serializeRoom(room));
        if (room.status === "finished") this.stopGravity(matchId);
      }
    }, dropMs);
    this.gravityIntervals.set(matchId, gravityId);

    this.rabbit.consumeActions(matchId, (msg) => {
      if (!msg || this.room.getRoom(matchId)?.status === "finished") return;
      try {
        const raw = new TextDecoder().decode(msg.content);
        const payload = JSON.parse(raw) as ActionPayload;
        if (payload.matchId !== matchId || !payload.playerId || !payload.type) return;
        const playerId = payload.playerId === 1 || payload.playerId === 2 ? payload.playerId : null;
        if (!playerId) return;
        const action = {
          type: payload.type,
          dir: payload.dir as "left" | "right" | "down" | undefined,
        };
        const { room, matchEnd } = this.room.applyPlayerAction(matchId, playerId, action);
        const toPublish = this.room.serializeRoom(room);
        if (matchEnd) {
          (toPublish as any).event = "matchEnd";
          (toPublish as any).winnerId = room.winnerId;
          this.stopGravity(matchId);
        }
        this.rabbit.publishUpdate(matchId, toPublish);
      } catch (e) {
        const snippet = msg?.content
          ? new TextDecoder().decode(msg.content).slice(0, 200)
          : "";
        console.error("[GameConsumer] Parse/apply failed", { matchId, snippet, err: e });
      }
    });
  }
}
