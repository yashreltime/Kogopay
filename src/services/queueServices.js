import { connect } from 'amqplib';

import logger from '../middleware/logger';
import { QUEUE } from '../config/env';

const { CONN_URL, QUEUE_NAME } = QUEUE;
let ch = null;

const createConn = async () => {
  try {
    const conn = await connect(CONN_URL);
    if (conn) {
      logger.info('Connected to RabbitMQ');
    }
    ch = await conn.createChannel();
  } catch (e) {
    logger.error(`Rabbit MQ connection failed : ${JSON.stringify(e)}`);
    logger.info('Reconnecting...');
    setTimeout(() => {
      createConn();
    }, 10000);
  }
};

const publishToQueue = async (data) => {
  if (!data) return;
  if (!ch) await createConn();
  await ch.assertQueue(QUEUE_NAME);
  if (data) {
    await ch.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)), { persistent: true });
    logger.info('Published to queue.');
  }
};

const consumeQueue = async (method) => {
  if (!ch) await createConn();
  if (ch) {
    logger.info('Listening to queue.');
    await ch.assertQueue(QUEUE_NAME);
    await ch.prefetch(1);
    await ch.consume(
      QUEUE_NAME,
      async (msg) => {
        let out = msg.content.toString();
        out = JSON.parse(out);
        try {
          await method(out);
          ch.ack(msg);
        } catch (err) {
          logger.error(`Error while consuming queue,\n ${err}`);
        }
      },
      { noAck: false }
    );
  }
};

process.on('exit', (code) => {
  if (ch) {
    ch.close();
    logger.error(`Closing rabbitMQ channel`);
  }
});

module.exports = { createConn, publishToQueue, consumeQueue };
