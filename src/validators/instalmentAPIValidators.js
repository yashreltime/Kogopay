import { Joi } from 'express-validation';

const schema = {
  amount: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
    }),
  },
  collateral: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
      unitPrice: Joi.number().min(0).required(),
    }),
  },
  pendingInstalment: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
    }),
  },
  pendingTokens: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
    }),
  },
  pay: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
      instalmentCount: Joi.number().integer().min(0).required(),
      instalmentAmount: Joi.number().min(0).required(),
      paymentAddress: Joi.string().length(42).required(),
    }),
  },
  delayed: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
      collateral: Joi.string().valid('RTO').required(),
      unitPrice: Joi.number().min(0).required(),
    }),
  },
  full: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
      amount: Joi.number().min(0).required(),
      paymentAddress: Joi.string().length(42).required(),
    }),
  },
  close: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
    }),
  },
};

module.exports = schema;
