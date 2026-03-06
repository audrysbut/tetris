import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.ts";
import { MatchModule } from "./src/match/match.module.ts";

@Module({
  imports: [MatchModule],
  controllers: [AppController],
})
export class AppModule {}
