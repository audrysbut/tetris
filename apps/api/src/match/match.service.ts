import { Injectable } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service.ts";
import { GameRoomService } from "../game/game-room.service.ts";
import { GameConsumerService } from "../game/game-consumer.service.ts";
import type { CreateMatchResult, JoinMatchResult } from "shared";

interface MatchMeta {
  matchId: string;
  playerCount: number;
}

@Injectable()
export class MatchService {
  private matches = new Map<string, MatchMeta>();

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly room: GameRoomService,
    private readonly gameConsumer: GameConsumerService
  ) {}

  async createMatch(): Promise<CreateMatchResult> {
    const matchId = crypto.randomUUID().slice(0, 8);
    await this.rabbit.assertActionsQueue(matchId);
    this.room.createRoom(matchId);
    this.matches.set(matchId, { matchId, playerCount: 0 });
    return {
      matchId,
      actionsDestination: `/amq/queue/match.${matchId}.actions`,
      updatesDestination: `/topic/match.${matchId}.updates`,
    };
  }

  async joinMatch(matchId: string): Promise<JoinMatchResult | null> {
    const meta = this.matches.get(matchId);
    const room = this.room.getRoom(matchId);
    if (!meta || !room || meta.playerCount >= 2) return null;
    meta.playerCount += 1;
    const playerId = meta.playerCount as 1 | 2;
    const gameStarted = meta.playerCount === 2;
    if (gameStarted) {
      this.room.startGame(matchId);
      this.gameConsumer.startConsuming(matchId);
      const room = this.room.getRoom(matchId)!;
      this.rabbit.publishUpdate(matchId, { event: "gameStart", ...this.room.serializeRoom(room) });
    }
    return {
      matchId,
      playerId,
      actionsDestination: `/amq/queue/match.${matchId}.actions`,
      updatesDestination: `/topic/match.${matchId}.updates`,
      gameStarted,
    };
  }
}
