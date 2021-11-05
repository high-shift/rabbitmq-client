"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const events_1 = require("events");
const verror_1 = __importDefault(require("verror"));
const producer_1 = __importDefault(require("./producer"));
const consumer_1 = __importDefault(require("./consumer"));
class RabbitMQClient extends events_1.EventEmitter {
    constructor(amqpUrl, resources) {
        super();
        this.amqpUrl = amqpUrl;
        this.resources = resources;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async init() {
        try {
            this.connection = await amqplib_1.default.connect(this.amqpUrl);
            this.createListeners(this.connection);
            if (this.resources.producer) {
                await this.initProducer();
            }
            if (this.resources.consumer) {
                await this.initConsumer();
            }
        }
        catch (error) {
            const err = error;
            throw new verror_1.default(err, 'Failed to connect to RabbitMQ');
        }
    }
    async initProducer() {
        this.producer = new producer_1.default(this);
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
    async initConsumer() {
        this.consumer = new consumer_1.default(this);
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
    async createChannel() {
        if (!this.connection) {
            throw new Error('The connection must be initialized');
        }
        return this.connection.createChannel();
    }
    createListeners(connection) {
        connection.on('close', (err) => {
            if (err) {
                this.emit('error', new verror_1.default(err, 'RabbitMQ Connection closed due to error'));
            }
            else {
                this.emit('info', new verror_1.default('RabbitMQ Connection closed'));
            }
        });
        connection.on('error', (err) => {
            this.emit('error', new verror_1.default(err, 'RabbitMQ Connection error'));
        });
        connection.on('blocked', (reason) => {
            this.emit('warn', new verror_1.default({
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
    async closeConnection() {
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
exports.default = RabbitMQClient;
exports.RabbitMQClient = RabbitMQClient;
