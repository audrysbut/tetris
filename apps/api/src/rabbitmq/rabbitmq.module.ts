import { Module, Global } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service.ts";

@Global()
@Module({
  providers: [RabbitMQService],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
