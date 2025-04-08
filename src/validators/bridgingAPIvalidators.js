import { Joi } from 'express-validation';

const schema = {
  mint: {
    body: Joi.object({
      type: Joi.string().valid('mint').required(),
      code: Joi.string().valid('ETH', 'USDT', 'USDC', 'ERTC', 'BNB', 'BTC').required(),
      chain: Joi.string().required(),
      toAddress: Joi.when('code', {
        not: 'BTC',
        then: Joi.string().length(42),
        otherwise: Joi.string(),
      }).required(),
      fromAddress: Joi.when('code', {
        not: 'BTC',
        then: Joi.string().length(42),
        otherwise: Joi.string(),
      }).required(),
      value: Joi.string().required(),
      txHash: Joi.string().required(),
      paymentType: Joi.when('code', {
        is: 'BTC',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      blockHeight: Joi.when('code', {
        is: 'BTC',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
      blockHash: Joi.when('code', {
        is: 'BTC',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
      }),
    }),
  },
  burn: {
    body: Joi.object({
      type: Joi.string().valid('burn').required(),
      code: Joi.string().valid('WETH', 'WUSDT', 'WUSDC', 'RTC', 'WBNB', 'WBTC').required(),
      chain: Joi.string().required(),
      toAddress: Joi.string().length(42).required(),
      fromAddress: Joi.string().length(42).required(),
      value: Joi.string().required(),
      txHash: Joi.string().required(),
    }),
  },
};

module.exports = schema;
