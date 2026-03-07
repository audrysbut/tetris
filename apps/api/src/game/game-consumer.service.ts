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

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly room: GameRoomService
  ) {}

  /** Start consuming actions for a match (call when game starts) */
  startConsuming(matchId: string): void {
    if (this.activeConsumers.has(matchId)) return;
    this.activeConsumers.add(matchId);

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
