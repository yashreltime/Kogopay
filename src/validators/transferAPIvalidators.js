import { Joi } from 'express-validation';
import config from '../config/env';

const schema = {
  buy: {
    body: Joi.object({
      receiver: Joi.string().length(42).required(),
      amount: Joi.number().greater(0).required(),
      coinCode: Joi.string().valid(...config.CURRENCY_LIST).required(),
    }),
  },
  getTxnStatus: {
    body: Joi.object({
      txnHash: Joi.string().length(66).required(),
      chain: Joi.string().valid('RTC', 'ETH', 'BNB').optional(),
    }),
  },
  createTxn: {
    body: Joi.object({
      amount: Joi.number().greater(0).required(),
      coinCode: Joi.string().required(),
      sender: Joi.alternatives()
        .conditional('coinCode', {
          is: 'BTC',
          then: Joi.string().required(),
          otherwise: Joi.string().length(42).optional(),
        })
        .required(),
      receiver: Joi.alternatives()
        .conditional('coinCode', {
          is: 'BTC',
          then: Joi.string().required(),
          otherwise: Joi.string().length(42).optional(),
        })
        .required(),
    }),
  },
  sendTxn: {
    body: Joi.object({
      signedTxn: Joi.string().required(),
      chain: Joi.string().valid('RTC', 'ETH', 'BNB', 'BTC').optional(),
    }),
  },
  sendBitcoinTxn: {
    body: Joi.object({
      hexstring: Joi.string().required(),
    }),
  },
  approval: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      spender: Joi.string().length(42).required(),
      amount: Joi.number().greater(0).required(),
      coinCode: Joi.string().valid('RTO').required(),
      action: Joi.string().valid('ADD', 'INC', 'DEC').required(),
    }),
  },
  allowance: {
    body: Joi.object({
      owner: Joi.string().length(42).required(),
      spender: Joi.string().length(42).required(),
      coinCode: Joi.string().valid('RTO').required(),
    }),
  },
  refill: {
    body: Joi.object({
      amount: Joi.number().greater(0).required(),
      coinCode: Joi.string().valid(...config.CURRENCY_LIST).required(),
    }),
  },
};

module.exports = schema;
