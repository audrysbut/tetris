import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): { message: string } {
    return { message: "Hello from NestJS API" };
  }

  @Get("health")
  getHealth(): { status: string } {
    return { status: "ok" };
  }
}
