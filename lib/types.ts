import Amqplib from 'amqplib';

export type ConsumerCallback<T> = (msg: T) => Promise<void> | void;

export interface IConsumerMessage<T> {
  payload: T,
  properties: Amqplib.MessageProperties,
  fields: Amqplib.MessageFields
}
