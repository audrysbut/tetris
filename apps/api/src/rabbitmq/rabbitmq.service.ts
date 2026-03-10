import { Injectable, OnModuleDestroy } from "@nestjs/common";
import amqp from "amqplib";
import { Buffer } from "node:buffer";

const EXCHANGE_UPDATES = "amq.topic";
const EXCHANGE_GRAVITY_DELAYED = "gravity.delayed.fanout";
const QUEUE_ACTIONS = "match.actions";
const QUEUE_GRAVITY = "match.gravity";

/** Minimal type for amqplib connection so we can call close() without using any */
interface AmqpConnection {
  close(): Promise<void>;
}

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private conn: AmqpConnection | null = null;
  private channel: amqp.Channel | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureConnection(): Promise<void> {
    if (this.channel) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const url = Deno.env.get("RABBITMQ_URL") ?? "amqp://guest:guest@localhost:5672";
        const connection = await amqp.connect(url);
        this.conn = connection as unknown as AmqpConnection;
        this.channel = await connection.createChannel();
        // Only assert our own exchange; amq.topic is used by STOMP and may already exist
        if (EXCHANGE_UPDATES !== "amq.topic") {
          await this.channel.assertExchange(EXCHANGE_UPDATES, "topic", { durable: false });
        }
        // Delayed message exchange for gravity ticks (plugin: x-delayed-message); fanout so one queue receives all delayed messages
        await this.channel.assertExchange(EXCHANGE_GRAVITY_DELAYED, "x-delayed-message", {
          durable: false,
          arguments: { "x-delayed-type": "fanout" },
        });
        await this.channel.assertQueue(QUEUE_ACTIONS, { durable: false });
        await this.channel.assertQueue(QUEUE_GRAVITY, { durable: false });
        await this.channel.bindQueue(QUEUE_GRAVITY, EXCHANGE_GRAVITY_DELAYED, "");
      } catch (err) {
        console.error("[RabbitMQ] Connection or channel failed:", err);
        throw err;
      }
    })();
    await this.initPromise;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.channel) await this.channel.close().catch(() => {});
    if (this.conn) await this.conn.close().catch(() => {});
  }

  /** Consume messages from shared actions queue (dispatch by payload.matchId in handler) */
  async consumeActions(
    handler: (msg: { content: Uint8Array; fields: { routingKey: string } } | null) => void
  ): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    await this.channel.consume(QUEUE_ACTIONS, handler as any, { noAck: true });
  }

  /** Publish a delayed gravity tick message (delivered after delayMs) */
  async publishGravityDelayed(matchId: string, delayMs: number): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const routingKey = `match.${matchId}.gravity`;
    const body = JSON.stringify({ matchId });
    this.channel.publish(EXCHANGE_GRAVITY_DELAYED, routingKey, Buffer.from(body, "utf8"), {
      headers: { "x-delay": delayMs },
    });
  }

  /** Consume gravity tick messages from shared queue (dispatch by payload/routing key in handler); returns consumerTag */
  async consumeGravity(handler: (msg: amqp.ConsumeMessage | null) => void): Promise<string> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const result = await this.channel.consume(QUEUE_GRAVITY, handler, { noAck: true });
    return result.consumerTag;
  }

  /** Cancel a consumer by tag (e.g. gravity consumer when match ends) */
  async cancelConsumer(consumerTag: string): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    await this.channel.cancel(consumerTag);
  }

  /** Publish game state update to match topic (clients subscribe via Web STOMP) */
  async publishUpdate(matchId: string, payload: unknown): Promise<void> {
    await this.ensureConnection();
    if (!this.channel) throw new Error("RabbitMQ not connected");
    const key = `match.${matchId}.updates`;
    const body = JSON.stringify(payload);
    this.channel.publish(EXCHANGE_UPDATES, key, Buffer.from(body, "utf8"));
  }

  getActionsQueueName(_matchId?: string): string {
    return QUEUE_ACTIONS;
  }

  getUpdatesTopicKey(matchId: string): string {
    return `match.${matchId}.updates`;
  }
}
