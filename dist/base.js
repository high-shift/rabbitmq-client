"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const verror_1 = __importDefault(require("verror"));
class MQBase extends events_1.EventEmitter {
    constructor(type, rabbitMQClient) {
        super();
        this.type = type;
        this.rabbitMQClient = rabbitMQClient;
    }
    async init() {
        try {
            const channel = await this.rabbitMQClient.createChannel();
            this.createListeners(channel);
            this.ch = channel;
        }
        catch (err) {
            const error = err;
            throw new verror_1.default(error, `Failed to create a ${this.type} for the RabbitMQ`);
        }
    }
    createListeners(channel) {
        channel.on('error', (err) => {
            this.emit('error', new verror_1.default(err, `RabbitMQ ${this.type} Channel error`));
        });
        channel.on('drain', () => {
            this.emit('warn', `RabbitMQ ${this.type} Channel was drained`);
        });
        channel.on('return', () => {
            this.emit('warn', `RabbitMQ ${this.type} Channel message returned`);
        });
    }
    async dispose() {
        if (this.ch) {
            this.ch.removeAllListeners();
            await this.ch.close();
        }
    }
}
exports.default = MQBase;
