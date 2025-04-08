import { Joi } from 'express-validation';

const schema = {
  earnings: {
    body: Joi.object({
      amount: Joi.number().greater(0).required(),
      interest: Joi.number().min(0).max(100).required(),
      duration: Joi.number().integer().greater(0).required(),
    }),
  },
  set: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      contract: Joi.string().valid('REGISTRY', 'PAYMENT').required(),
    }),
  },
  roles: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      code: Joi.string().valid('RTO').required(),
      depositer: Joi.string().length(42).required(),
      withdrawer: Joi.string().length(42).required(),
    }),
  },
  collateralPercentage: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      percentage: Joi.number().min(0).max(100).required(),
    }),
  },
  collateralIntrestFactor: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      factor: Joi.number().min(0).required(),
    }),
  },
  delayCount: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      count: Joi.number().integer().required(),
    }),
  },
  withdrawEscrowFund: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      receiver: Joi.string().length(42).required(),
    }),
  },
};

module.exports = schema;
