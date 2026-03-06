import { Module } from "@nestjs/common";
import { MatchController } from "./match.controller.ts";
import { MatchService } from "./match.service.ts";
import { RabbitMQModule } from "../rabbitmq/rabbitmq.module.ts";
import { GameModule } from "../game/game.module.ts";

@Module({
  imports: [RabbitMQModule, GameModule],
  controllers: [MatchController],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
