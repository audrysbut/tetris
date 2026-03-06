import { Global, Module } from "@nestjs/common";
import { GameRoomService } from "./game-room.service.ts";
import { GameConsumerService } from "./game-consumer.service.ts";

@Global()
@Module({
  providers: [GameRoomService, GameConsumerService],
  exports: [GameRoomService, GameConsumerService],
})
export class GameModule {}
