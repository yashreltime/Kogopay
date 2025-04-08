import { Joi } from 'express-validation';

const schema = {
  create: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().min(0).required(),
      amount: Joi.number().greater(0).required(),
      interestRate: Joi.number().min(0).max(100).required(),
      instalmentMonths: Joi.number().integer().greater(0).required(),
      isDirect: Joi.boolean().required(),
      isCollateral: Joi.boolean().required(),
      isDirectAddress: Joi.alternatives().conditional('isDirect', {
        is: true,
        then: Joi.string().length(42).required(),
        otherwise: Joi.string().length(42).optional(),
      }),
    }),
  },
  remove: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().min(0).required(),
    }),
  },
  proposalCount: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
    }),
  },
  proposalIdByIndex: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      index: Joi.number().integer().min(0).required(),
    }),
  },
  borrowRequests: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().min(0).required(),
    }),
  },
  accept: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().min(0).required(),
      borrower: Joi.string().length(42).required(),
      accept: Joi.boolean().required(),
    }),
  },
};

module.exports = schema;
