import { Injectable } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service.ts";
import { GameRoomService } from "./game-room.service.ts";
import type { GameAction } from "shared";

interface ActionPayload {
  matchId: string;
  playerId: 1 | 2;
  type: string;
  dir?: string;
}

@Injectable()
export class GameConsumerService {
  private activeConsumers = new Set<string>();
  private gravityConsumerTags = new Map<string, string>();

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly room: GameRoomService
  ) {}

  private stopGravity(matchId: string): void {
    const tag = this.gravityConsumerTags.get(matchId);
    if (tag != null) {
      this.rabbit.cancelConsumer(tag).catch((err) =>
        console.error("[GameConsumer] cancelConsumer failed", { matchId, err })
      );
      this.gravityConsumerTags.delete(matchId);
    }
  }

  /** Start consuming actions and gravity for a match (call when game starts) */
  async startConsuming(matchId: string): Promise<void> {
    if (this.activeConsumers.has(matchId)) return;
    this.activeConsumers.add(matchId);

    await this.rabbit.assertGravityQueue(matchId);

    const tag = await this.rabbit.consumeGravity(matchId, (msg) => {
      if (!msg) return;
      const r = this.room.getRoom(matchId);
      if (!r || r.status === "finished") {
        this.stopGravity(matchId);
        return;
      }
      const room = this.room.tickGravity(matchId);
      if (room) {
        this.rabbit.publishUpdate(matchId, this.room.serializeRoom(room));
        if (room.status === "finished") {
          this.stopGravity(matchId);
        } else {
          this.rabbit.publishGravityDelayed(matchId, this.room.getDropIntervalMs());
        }
      }
    });
    this.gravityConsumerTags.set(matchId, tag);

    this.rabbit.publishGravityDelayed(matchId, this.room.getDropIntervalMs());

    this.rabbit.consumeActions(matchId, (msg) => {
      if (!msg || this.room.getRoom(matchId)?.status === "finished") return;
      try {
        const raw = new TextDecoder().decode(msg.content);
        const payload = JSON.parse(raw) as ActionPayload;
        if (payload.matchId !== matchId || !payload.playerId || !payload.type) return;
        const playerId = payload.playerId === 1 || payload.playerId === 2 ? payload.playerId : null;
        if (!playerId) return;
        const action: GameAction = {
          type: payload.type as GameAction["type"],
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
