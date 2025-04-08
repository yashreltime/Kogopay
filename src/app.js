import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import jwt from 'express-jwt';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';

import connectDb from './services/mongoService';
import { syncDb } from './services/nonceManagerService';
import { queueManager } from './services/bridgingServices';
import env from './config/env';
import logger from './middleware/logger';
import routes from './routes/routes.js';
import corsEnabledURLs from './constants/corsUrls';
import corsOptionsDelegate from './middleware/corsHandler';
import errorHandler from './middleware/errorHandler.js';
import httpResponse from './models/httpResponseModel';
import { getAuthPublicKey } from './services/authService';
import openAccessUrls from './constants/openAccessUrls';
import tokenConfig from './config/jwtTokens';
import { swaggerDoc, swaggerOptions } from './config/swagger';
import { consumeQueue } from './services/queueServices';
import { preRegisterUsers } from './services/userServices';

const app = express();

app.use(morgan('short', { stream: logger.stream }));

if (env.NODE_ENV === 'production') {
  if (env.ALLOW_DOMAIN) {
    const domains = env.ALLOW_DOMAIN.split(',');
    domains.forEach((domain) => corsEnabledURLs.push(domain.toLowerCase()));
  }
  app.use(cors(corsOptionsDelegate));
} else {
  app.use(cors());
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  jwt({ secret: getAuthPublicKey(), algorithms: [tokenConfig.accessToken.algorithm] }).unless({
    path: [...openAccessUrls],
  })
);

//!TO REMOVE
app.use('/', (req, res, next) => {
  logger.log({ level: 'debug', message: JSON.stringify(req.body) });
  next();
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, swaggerOptions));
app.use('/api', routes);
app.use('/', async (req, res, next) => {
  res.send(new httpResponse(true));
});
app.use(errorHandler);

// Connecting to DB and queue to do Bridging operations
connectDb()
  .then(async () => {
    try {
      //Syncing nonces
      await syncDb();
      await consumeQueue(queueManager);
      try {
        logger.info(`Pre-registration of users started.`);
        const rejectedUsers = await preRegisterUsers();
        logger.info(`Pre-registration of users completed.`);
        if (rejectedUsers.length) {
          logger.info(`Pre-registration failed for these users: ${JSON.stringify(rejectedUsers)}`);
        }
      } catch (e) {
        logger.error(`Error pre-registering users: ${e}`);
      }
      app.emit('ready');
    } catch (e) {
      logger.error(`Error in reading queue: ${e}`);
    }
  })
  .catch((e) => {
    logger.error(`Error connecting to DB: ${e}`);
  });

module.exports = app;
