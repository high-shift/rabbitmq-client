import Amqplib from 'amqplib';
import { IConsumerMessage } from './types';

function generateCID(): string {
    let cid = '';

    for (let i = 0; i < 5; i++) {
        cid += randomCharInc();
    }

    return (cid);
}

function randomCharInc(): string {
    const low = 65,  // A
        high = 90; // Z
    return String.fromCharCode(Math.floor(Math.random() * (high - low + 1) + low));
}

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

function parseMessage<T>(msg: Amqplib.ConsumeMessage): IConsumerMessage<T> {
    let content = null;

    try {
        content = JSON.parse(msg.content.toString());
    } catch (err) {
        content = msg.content.toString();
    }

    return {
        payload: content,
        properties: msg.properties,
        fields: msg.fields
    } as IConsumerMessage<T>;
}

export {
    generateCID,
    randomCharInc,
    parseMessage,
    sleep
};
