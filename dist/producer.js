"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
const verror_1 = __importDefault(require("verror"));
const utils_1 = require("./utils");
const base_1 = __importDefault(require("./base"));
class MQProducer extends base_1.default {
    constructor(rabbitMQClient) {
        super('Producer', rabbitMQClient);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async enqueue(queue, message, retries = 1, assert = false) {
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
                    cid: '.' + utils_1.generateCID()
                }
            };
            await this.ch.sendToQueue(queue, Buffer.from(message), properties);
            this.emit('info', {
                info: 'Published message',
                queue,
                properties
            });
        }
        catch (err) {
            throw new verror_1.default({
                cause: err,
                info: {
                    queue, message, retries
                }
            }, 'Failed to enqueue the message');
        }
    }
    async publish(exchange, routingKey, message, retries = 1) {
        try {
            if (message && typeof message == 'object') {
                message = JSON.stringify(message);
            }
            const properties = {
                headers: {
                    retries,
                    cid: '.' + utils_1.generateCID()
                }
            };
            await this.ch.publish(exchange, routingKey, Buffer.from(message), properties);
            this.emit('info', {
                info: 'Published message',
                exchange,
                routingKey,
                properties
            });
        }
        catch (err) {
            throw new verror_1.default({
                cause: err,
                info: {
                    exchange, routingKey, message, retries
                }
            }, 'Failed to publish the message');
        }
    }
}
exports.default = MQProducer;
