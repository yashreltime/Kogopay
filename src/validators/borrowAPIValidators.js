import { Joi } from 'express-validation';

const schema = {
  confirm: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      proposalId: Joi.number().integer().required(),
      isCollateral: Joi.boolean().required(),
      accept: Joi.boolean().required(),
      collateralAmount: Joi.number().min(0).required(),
    }),
  },
  collateral: {
    body: Joi.object({
      amount: Joi.number().min(0).required(),
      interest: Joi.number().min(0).required(),
    }),
  },
};

module.exports = schema;
