"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const verror_1 = __importDefault(require("verror"));
const utils_1 = require("./utils");
const base_1 = __importDefault(require("./base"));
class MQConsumer extends base_1.default {
    constructor(rabbitMQClient) {
        super('Consumer', rabbitMQClient);
    }
    async ack(queue, msg) {
        try {
            await this.ch.ack(msg);
            this.emit('info', {
                info: 'Message ack',
                queue,
                content: msg.content.toString()
            });
        }
        catch (err) {
            const error = err;
            this.emit('warn', new verror_1.default({
                cause: error,
                info: { queue, content: msg.content.toString() }
            }, 'Failed to acknowledge the message'));
        }
    }
    async consume(queue, callback, prefetch = 1, opts) {
        try {
            await this.ch.prefetch(prefetch);
            await this.ch.consume(queue, async (msg) => {
                try {
                    if (!msg) {
                        await this.ack(queue, msg);
                        return;
                    }
                    const newMessage = utils_1.parseMessage(msg);
                    this.emit('info', { info: 'Received message', queue, payload: newMessage });
                    const result = callback(newMessage.payload);
                    if (result instanceof Promise) {
                        await result;
                    }
                }
                catch (err) {
                    const error = err;
                    this.emit('warn', new verror_1.default({
                        cause: error,
                        info: {
                            queue, opts
                        }
                    }, 'Failed to consume the queue'));
                }
                finally {
                    await this.ack(queue, msg);
                }
            }, opts);
        }
        catch (err) {
            const error = err;
            throw new verror_1.default(error, 'Failed to consume the queue');
        }
    }
}
exports.default = MQConsumer;
