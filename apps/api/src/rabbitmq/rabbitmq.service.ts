import { Injectable, OnModuleDestroy } from "@nestjs/common";
import amqp from "amqplib";
import { Buffer } from "node:buffer";

const EXCHANGE_UPDATES = "game.updates";

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private conn: amqp.Channel | null = null;
  private channel: amqp.Channel | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureConnection(): Promise<void> {
    if (this.channel) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const url = Deno.env.get("RABBITMQ_URL") ?? "amqp://guest:guest@localhost:5672";
      const connection = await amqp.connect(url);
      this.conn = connection as any;
      this.channel = await connection.createChannel();
      await this.channel.assertExchange(EXCHANGE_UPDATES, "topic", { durable: false });
    })();
    await this.initPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) await this.channel.close().catch(() => {});
    if (this.conn) await (this.conn as any).close().catch(() => {});
  }

  /** Assert queue for match actions (clients send here via STOMP) */
  async assertActionsQueue(matchId: string): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const name = `match.${matchId}.actions`;
    await this.channel.assertQueue(name, { durable: false });
  }

  /** Consume messages from match actions queue */
  async consumeActions(
    matchId: string,
    handler: (msg: { content: Uint8Array; fields: { routingKey: string } } | null) => void
  ): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const name = `match.${matchId}.actions`;
    await this.channel.consume(name, handler as any, { noAck: true });
  }

  /** Publish game state update to match topic (clients subscribe via Web STOMP) */
  async publishUpdate(matchId: string, payload: unknown): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const key = `match.${matchId}.updates`;
    const body = JSON.stringify(payload);
    this.channel.publish(EXCHANGE_UPDATES, key, Buffer.from(body, "utf8"));
  }

  getActionsQueueName(matchId: string): string {
    return `match.${matchId}.actions`;
  }

  getUpdatesTopicKey(matchId: string): string {
    return `match.${matchId}.updates`;
  }
}
