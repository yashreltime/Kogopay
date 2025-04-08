import config from '../config/env';
import logger from '../middleware/logger';
import Mint from '../models/mintTxnSchemaModel';
import Burn from '../models/burnTxnSchemaModel';
import DB_CONSTANTS from '../constants/dbConstants';
import { sendWrappedTokens, burningOrganizer } from './bridgingServices';

const RETRIES = parseInt(config.RETRIES);

const fetchPendingRequests = async (type) => {
  if (type === 'mint') {
    return await Mint.find({
      status: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED,
      tries: { $lt: RETRIES },
    });
  } else {
    return await Burn.find({
      status: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED,
      tries: { $lt: RETRIES },
    });
  }
};

const processPendingRequests = async (type) => {
  const pendingRequests = await fetchPendingRequests(type);

  if (pendingRequests.length > 0) {
    logger.info('Processing pending bridging requests');
    // process one by one
    const promises = pendingRequests.map(async (txn) => {
      if (type === 'mint') {
        return sendWrappedTokens(txn.raw);
      } else {
        return burningOrganizer(txn.raw);
      }
    });
    await Promise.allSettled(promises);
    return;
  } else {
    logger.info('No transactions on pending list.');
  }
};

module.exports = {
  processPendingRequests,
};
