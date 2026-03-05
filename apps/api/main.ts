// import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(3000);
