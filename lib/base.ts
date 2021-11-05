import Amqplib from 'amqplib';
import { EventEmitter } from 'events';
import VError from 'verror';

import { RabbitMQClient } from './index';

abstract class MQBase extends EventEmitter {
  protected rabbitMQClient: RabbitMQClient

  protected ch: Amqplib.Channel;

  private type: string;

  constructor(type: string, rabbitMQClient: RabbitMQClient) {
      super();

      this.type = type;
      this.rabbitMQClient = rabbitMQClient;
  }

  public async init(): Promise<void> {
      try {
          const channel = await this.rabbitMQClient.createChannel();
          this.createListeners(channel);

          this.ch = channel;
      } catch (err) {
          const error = err as Error;
          throw new VError(error, `Failed to create a ${this.type} for the RabbitMQ`);
      }
  }

  private createListeners(channel: Amqplib.Channel): void {
      channel.on('error', (err) => {
          this.emit('error', new VError(err, `RabbitMQ ${this.type} Channel error`));
      });
      channel.on('drain', () => {
          this.emit('warn', `RabbitMQ ${this.type} Channel was drained`);
      });
      channel.on('return', () => {
          this.emit('warn', `RabbitMQ ${this.type} Channel message returned`);
      });
  }

  public async dispose(): Promise<void> {
      if (this.ch) {
          this.ch.removeAllListeners();
          await this.ch.close();
      }
  }
}

export default MQBase;
