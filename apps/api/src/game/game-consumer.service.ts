import { Injectable } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service.ts";
import { GameRoomService } from "./game-room.service.ts";
import type { GameAction } from "shared";
import type amqp from "amqplib";

interface ActionPayload {
  matchId: string;
  playerId: 1 | 2;
  type: string;
  dir?: string;
}

function getMatchIdFromGravityMessage(msg: amqp.ConsumeMessage): string | null {
  try {
    const body = JSON.parse(new TextDecoder().decode(msg.content)) as { matchId?: string };
    if (body.matchId) return body.matchId;
  } catch {
    // ignore
  }
  const key = msg.fields.routingKey ?? "";
  const m = /^match\.(.+)\.gravity$/.exec(key);
  return m ? m[1]! : null;
}

@Injectable()
export class GameConsumerService {
  private consumersStartPromise: Promise<void> | null = null;

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly room: GameRoomService
  ) {}

  private stopGravity(_matchId: string): void {
    // No-op: gravity stops by not scheduling next delayed message
  }

  private async ensureConsumersStarted(): Promise<void> {
    if (this.consumersStartPromise) return this.consumersStartPromise;
    this.consumersStartPromise = (async () => {
      await this.rabbit.consumeGravity((msg) => {
        if (!msg) return;
        const matchId = getMatchIdFromGravityMessage(msg);
        if (!matchId) return;
        const r = this.room.getRoom(matchId);
        if (!r || r.status === "finished") return;
        const room = this.room.tickGravity(matchId);
        if (room) {
          this.rabbit.publishUpdate(matchId, this.room.serializeRoom(room));
          if (room.status !== "finished") {
            this.rabbit.publishGravityDelayed(matchId, this.room.getDropIntervalMs());
          }
        }
      });

      await this.rabbit.consumeActions((msg) => {
        if (!msg) return;
        try {
          const raw = new TextDecoder().decode(msg.content);
          const payload = JSON.parse(raw) as ActionPayload;
          const matchId = payload.matchId;
          if (!matchId || !payload.playerId || !payload.type) return;
          if (this.room.getRoom(matchId)?.status === "finished") return;
          const playerId = payload.playerId === 1 || payload.playerId === 2 ? payload.playerId : null;
          if (!playerId) return;
          const action: GameAction = {
            type: payload.type as GameAction["type"],
            dir: payload.dir as "left" | "right" | "down" | undefined,
          };
          const { room, matchEnd } = this.room.applyPlayerAction(matchId, playerId, action);
          const toPublish = this.room.serializeRoom(room) as Record<string, unknown>;
          if (matchEnd) {
            toPublish.event = "matchEnd";
            toPublish.winnerId = room.winnerId;
            this.stopGravity(matchId);
          }
          this.rabbit.publishUpdate(matchId, toPublish);
        } catch (e) {
          const snippet = msg?.content
            ? new TextDecoder().decode(msg.content).slice(0, 200)
            : "";
          console.error("[GameConsumer] Parse/apply failed", { snippet, err: e });
        }
      });
    })();
    return await this.consumersStartPromise;
  }

  /** Ensure global consumers are running and schedule first gravity tick for this match */
  async startConsuming(matchId: string): Promise<void> {
    await this.ensureConsumersStarted();
    await this.rabbit.publishGravityDelayed(matchId, this.room.getDropIntervalMs());
  }
}
