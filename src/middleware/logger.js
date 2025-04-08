import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import os from 'os';
import { S3StreamLogger } from 's3-streamlogger';

import config from '../config/logOptions';
import { NODE_ENV, S3 } from '../config/env';

let transportOptions = null;
const file = config.jsonFormat ? config.jsonFile : config.textFile;
const hostname = os.hostname();

const alignFormat = format.printf(({ timestamp, level, message, stack }) => {
  if (stack) {
    return `${timestamp} : [ ${level} ] : ${message}\n${stack}`;
  }
  return `${timestamp} : [ ${level} ] : ${message}`;
});

if (NODE_ENV !== 'dev') {
  // const s3Stream = new S3StreamLogger({
  //   ...S3,
  //   max_file_size: '20000000',
  //   name_format: `%Y-%m-%d-%H-%M-Ecosystem-Server-Logs-${hostname}.log`,
  //   rotate_every: '2592000000', // in milliseconds (30 days)
  // });
  // transportOptions = [
  //   new transports.Stream({
  //     stream: s3Stream,
  //   }),
  // ];
  transportOptions = [
    new DailyRotateFile(file),
    new transports.Console({
      format: format.combine(format.errors({ stack: true }), format.colorize(), alignFormat),
    }),
  ];
} else {
  transportOptions = [
    new DailyRotateFile(file),
    new transports.Console({
      format: format.combine(format.errors({ stack: true }), format.colorize(), alignFormat),
    }),
  ];
}

const logger = createLogger({
  level: config.level,
  format: config.jsonFormat
    ? format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json()
      )
    : format.combine(
        format.errors({ stack: true }),
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        alignFormat
      ),
  transports: transportOptions,
  exitOnError: false,
});

logger.stream = {
  write: function (message, encoding) {
    logger.http(message);
  },
};

module.exports = logger;
