import validator from 'express-validation';

import web3 from '../services/web3';
import logger from '../middleware/logger.js';
import errors from '../constants/errors.js';
import httpResponse from '../models/httpResponseModel.js';
import { syncDb } from '../services/nonceManagerService';

const errorHandler = async (err, req, res, next) => {
  let errorObj;
  if (err instanceof validator.ValidationError) {
    // Validation Errors
    errorObj = { message: errors.VALIDATION_ERROR.message, details: err };
    logger.error(JSON.stringify(errorObj));
    return res.status(errors.VALIDATION_ERROR.status).send(new httpResponse(false, null, errorObj));
  } else if (err && err.name === 'UnauthorizedError') {
    //JWT errors
    const ERR = errors.UNAUTHORIZED_ERROR;
    errorObj = { message: ERR.message, details: err.message };
    logger.error(JSON.stringify(errorObj));
    return res.status(ERR.status).send(new httpResponse(false, null, errorObj));
  } else if (err && Object.keys(errors).includes(err.message)) {
    //Custom errors
    const ERR = errors[err.message];
    if (err.message === "INSUFFICIENT_RTO_BALANCE") {
      err.message = "INSUFFICIENT_EURO_BALANCE";
    }
    errorObj = { message: err.message, details: ERR.message };
    logger.error(JSON.stringify(errorObj));
    await syncDb();
    return res.status(ERR.status).send(new httpResponse(false, null, errorObj));
  } else {
    // Internal Server errors or EVM errors
    const errorObj = {
      message: errors.SERVER_ERROR.message,
      details: err.message,
    };
    if (err.message === 'Returned error: Execution reverted' && err.data !== '0x') {
      errorObj.details = await getRevertReason(err);
    }
    logger.error(JSON.stringify(errorObj));
    await syncDb();
    return res.status(errors.SERVER_ERROR.status).send(new httpResponse(false, null, errorObj));
  }
};

const getRevertReason = async (err) => {
  try {
    return web3.utils
      .hexToAscii(err.data)
      .slice(68)
      .replace(/[^A-Za-z0-9,!'// ]/gi, '');
  } catch (e) {
    return 'Unable to get more details.';
  }
};

module.exports = errorHandler;
