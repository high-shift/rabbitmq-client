import Amqlib from 'amqplib';
import { EventEmitter } from 'events';
import VError from 'verror';

import MQProducer from './producer';
import MQConsumer from './consumer';

export interface IAMQPResources {
    producer: boolean;
    consumer: boolean;
}

export default class RabbitMQClient extends EventEmitter {
    private readonly amqpUrl: string;
    private resources: IAMQPResources;
    public producer: MQProducer;
    public consumer: MQConsumer;
    private connection: Amqlib.Connection;

    constructor(amqpUrl: string, resources: IAMQPResources) {
        super();
        this.amqpUrl = amqpUrl;
        this.resources = resources;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async init() {
        try {
            this.connection = await Amqlib.connect(this.amqpUrl);
            this.createListeners(this.connection);

            if (this.resources.producer) {
                await this.initProducer();
            }

            if (this.resources.consumer) {
                await this.initConsumer();
            }
        } catch (error) {
            const err = error as Error
            throw new VError(err, 'Failed to connect to RabbitMQ');
        }
    }

    private async initProducer() {
        this.producer = new MQProducer(this);
        this.producer.on('info', (args) => {
            this.emit('info', args);
        });
        this.producer.on('warn', (err) => {
            this.emit('warn', err);
        });
        this.producer.on('error', (err) => {
            this.emit('error', err);
        });

        await this.producer.init();
    }

    private async initConsumer() {
        this.consumer = new MQConsumer(this);
        this.consumer.on('info', (args) => {
            this.emit('info', args);
        });
        this.consumer.on('warn', (err) => {
            this.emit('warn', err);
        });
        this.consumer.on('error', (err) => {
            this.emit('error', err);
        });

        await this.consumer.init();
    }

    public async createChannel(): Promise<Amqlib.Channel> {
        if (!this.connection) {
            throw new Error('The connection must be initialized');
        }

        return this.connection.createChannel();
    }

    private createListeners(connection: Amqlib.Connection): void {
        connection.on('close', (err) => {
            if (err) {
                this.emit('error', new VError(err, 'RabbitMQ Connection closed due to error'));
            } else {
                this.emit('info', new VError('RabbitMQ Connection closed'));
            }
        });
        connection.on('error', (err) => {
            this.emit('error', new VError(err, 'RabbitMQ Connection error'));
        });
        connection.on('blocked', (reason) => {
            this.emit('warn', new VError({
                cause: new Error('The RabbitMQ connection have gotten blocked'),
                info: {
                    reason
                }
            }, 'RabbitMQ Connection was blocked'));
        });
        connection.on('unblocked', () => {
            this.emit('info', 'The RabbitMQ Connection have gotten unblocked');
        });
    }

    public async closeConnection(): Promise<void> {
        if (this.producer) {
            await this.producer.dispose();
        }

        if (this.consumer) {
            await this.consumer.dispose();
        }

        if (this.connection) {
            await this.connection.close();
        }
    }
}

export { RabbitMQClient };
