/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import VError from 'verror';

import { generateCID } from './utils';
import { RabbitMQClient } from './index';
import MQBase from './base';

class MQProducer extends MQBase {

    constructor(rabbitMQClient: RabbitMQClient) {
        super('Producer', rabbitMQClient);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async enqueue(queue: string, message: any, retries = 1, assert = false): Promise<void> {
        try {
            if (assert) {
                await this.ch.assertExchange(queue, 'direct', { durable: true });
                const q = await this.ch.assertQueue(queue, { durable: true });
                await this.ch.bindQueue(q.queue, queue, queue);
            }

            if (message && typeof message == 'object') {
                message = JSON.stringify(message);
            }

            const properties = {
                headers: {
                    retries,
                    cid: '.' + generateCID()
                }
            };

            await this.ch.sendToQueue(queue, Buffer.from(message), properties);

            this.emit('info', {
                info: 'Published message',
                queue,
                properties
            });
        } catch (err) {
            throw new VError({
                cause: err,
                info: {
                    queue, message, retries
                }
            }, 'Failed to enqueue the message');
        }
    }

    async publish(exchange: string, routingKey: string, message: any, retries = 1): Promise<void> {
        try {
            if (message && typeof message == 'object') {
                message = JSON.stringify(message);
            }

            const properties = {
                headers: {
                    retries,
                    cid: '.' + generateCID()
                }
            };

            await this.ch.publish(exchange, routingKey, Buffer.from(message), properties);

            this.emit('info', {
                info: 'Published message',
                exchange,
                routingKey,
                properties
            });
        } catch (err) {
            throw new VError({
                cause: err,
                info: {
                    exchange, routingKey, message, retries
                }
            }, 'Failed to publish the message');
        }
    }
}

export default MQProducer;
