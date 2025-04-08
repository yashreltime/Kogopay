import { Joi } from 'express-validation';
import config from '../config/env';

const schema = {
  price: {
    body: Joi.object({
      token: Joi.string().valid(...config.SWAP_CURRENCY_LIST).required(),
    }),
  },
  summary: {
    body: Joi.object({
      fromToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      fromAmount: Joi.when('toAmount', {
        is: 0,
        then: Joi.number().greater(0).required(),
        otherwise: Joi.number().valid(0).required(),
      }),
      toToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      toAmount: Joi.number().required(),
    }),
  },
  swapDetails: {
    body: Joi.object({
      id: Joi.number().required(),
    }),
  },
  approve: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      amount: Joi.number().greater(0).required(),
      token: Joi.string().valid(...config.SWAP_CURRENCY_LIST).required(),
    }),
  },
  init: {
    body: Joi.object({
      id: Joi.number().required(),
      from: Joi.string().length(42).required(),
      fromToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      fromAmount: Joi.number().greater(0).required(),
      toToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      toAmount: Joi.number().greater(0).required(),
    }),
  },
  swap: {
    body: Joi.object({
      type: Joi.string().valid('swap').required(),
      chain: Joi.string().required(),
      swapId: Joi.number().required(),
      fromAddress: Joi.string().length(42).required(),
      fromToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      fromAmount: Joi.string().required(),
      toToken: Joi.string()
        .valid(...config.SWAP_CURRENCY_LIST)
        .required(),
      toAmount: Joi.string().required(),
      txHash: Joi.string().required(),
    }),
  },
  setAdmin: {
    body: Joi.object({
      token: Joi.string().valid(...config.SWAP_CURRENCY_LIST).required(),
    }),
  },
  get: {
    body: Joi.object({
      token: Joi.string().valid(...config.SWAP_CURRENCY_LIST).required(),
    }),
  },
  setContract: {
    body: Joi.object({
      token: Joi.string().valid(...config.SWAP_CURRENCY_LIST).required(),
    }),
  },
  oracle: {
    body: Joi.object({
      oracle: Joi.string().length(42).required(),
    }),
  },
  fee: {
    body: Joi.object({
      fee: Joi.number().min(0).max(100).required(),
    }),
  },
};

module.exports = schema;
