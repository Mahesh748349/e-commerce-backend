import crypto from "node:crypto";
import amqplib, { type Channel, type ChannelModel } from "amqplib";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const ECOMMERCE_EXCHANGE = "ecommerce.events";

export type DomainEvent<T = unknown> = {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: T;
};

class RabbitMQManager {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;
  private isConnected = false;

  async init(): Promise<boolean> {
    if (this.isConnected && this.channel) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      this.connection = await amqplib.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      // Setup durable topic exchange for microservices event distribution
      await this.channel.assertExchange(ECOMMERCE_EXCHANGE, "topic", { durable: true });

      // Setup queues for decoupled consumer workflows
      const notificationQueue = "notification.worker.queue";
      const inventorySyncQueue = "inventory.sync.queue";

      await this.channel.assertQueue(notificationQueue, { durable: true });
      await this.channel.assertQueue(inventorySyncQueue, { durable: true });

      // Bind queues with routing key patterns
      await this.channel.bindQueue(notificationQueue, ECOMMERCE_EXCHANGE, "order.*");
      await this.channel.bindQueue(notificationQueue, ECOMMERCE_EXCHANGE, "payment.*");
      await this.channel.bindQueue(inventorySyncQueue, ECOMMERCE_EXCHANGE, "order.*");

      this.isConnected = true;
      logger.info("rabbitmq.connected", {
        url: env.RABBITMQ_URL.replace(/\/\/.*@/, "//***@"),
        exchange: ECOMMERCE_EXCHANGE
      });

      this.setupConsumers(notificationQueue, inventorySyncQueue);

      this.connection.on("error", (err: unknown) => {
        logger.warn("rabbitmq.connection.error", {
          error: err instanceof Error ? err.message : String(err)
        });
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        logger.warn("rabbitmq.connection.closed");
        this.isConnected = false;
      });

      return true;
    } catch (error) {
      logger.warn("rabbitmq.unavailable.continuing_without_broker", {
        message: error instanceof Error ? error.message : "Connection failed"
      });
      this.isConnected = false;
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  async publish(routingKey: string, data: unknown): Promise<boolean> {
    const event: DomainEvent = {
      eventId: crypto.randomUUID(),
      eventType: routingKey,
      timestamp: new Date().toISOString(),
      data
    };

    if (!this.isConnected || !this.channel) {
      logger.info("rabbitmq.event.buffered_offline", { routingKey, eventId: event.eventId });
      return false;
    }

    try {
      const payload = Buffer.from(JSON.stringify(event));
      this.channel.publish(ECOMMERCE_EXCHANGE, routingKey, payload, {
        persistent: true,
        contentType: "application/json"
      });

      logger.info("rabbitmq.event.published", {
        routingKey,
        eventId: event.eventId,
        exchange: ECOMMERCE_EXCHANGE
      });
      return true;
    } catch (error) {
      logger.error("rabbitmq.publish.failed", { routingKey, error });
      return false;
    }
  }

  private setupConsumers(notificationQueue: string, inventorySyncQueue: string) {
    if (!this.channel) return;

    // Notification Consumer Worker (Order confirmation email, SMS, push alerts)
    this.channel.consume(notificationQueue, (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as DomainEvent;
        logger.info("rabbitmq.worker.notification.processed", {
          eventType: event.eventType,
          eventId: event.eventId
        });
        this.channel?.ack(msg);
      } catch (err) {
        logger.error("rabbitmq.worker.notification.error", { error: err });
        this.channel?.nack(msg, false, false);
      }
    });

    // Inventory Reconciliation Worker (Inter-service inventory sync / metrics)
    this.channel.consume(inventorySyncQueue, (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as DomainEvent;
        logger.info("rabbitmq.worker.inventory_sync.processed", {
          eventType: event.eventType,
          eventId: event.eventId
        });
        this.channel?.ack(msg);
      } catch (err) {
        logger.error("rabbitmq.worker.inventory_sync.error", { error: err });
        this.channel?.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignore closing errors on shutdown
    } finally {
      this.isConnected = false;
      this.channel = null;
      this.connection = null;
    }
  }
}

export const rabbitMQ = new RabbitMQManager();
