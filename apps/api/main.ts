// import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.ts";

const app = await NestFactory.create(AppModule);
app.enableCors();
const port = Deno.env.get("PORT") ?? "3000";
await app.listen(Number(port));
