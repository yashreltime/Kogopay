import { Joi } from 'express-validation';

const schema = {
  create: {
    body: Joi.object({
      accountId: Joi.number().integer().min(0).required(),
      from: Joi.string().length(42).required(),
      members: Joi.array().items(Joi.string().length(42)).required(),
    }),
  },
  account: {
    body: Joi.object({
      accountId: Joi.number().integer().min(0).required(),
    }),
  },
  invite: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      members: Joi.array().items(Joi.string().length(42)).required(),
    }),
  },
  remove: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      member: Joi.string().length(42).required(),
    }),
  },
  join: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      isAccepted: Joi.boolean().required(),
    }),
  },
  role: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      member: Joi.string().length(42).required(),
      role: Joi.string()
        .valid('DEPOSIT_ROLE', 'WITHDRAW_ROLE', 'DEFAULT_ROLE', 'MULTI_ROLE', 'ADMIN_ROLE')
        .required(),
      isGranted: Joi.boolean().required(),
    }),
  },
  deposit: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      amount: Joi.number().min(0).required(),
    }),
  },
  withdraw: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      to: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      amount: Joi.number().min(0).required(),
    }),
  },
  status: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      isDeleted: Joi.boolean().required(),
    }),
  },
  withdrawFull: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
    }),
  },
  get: {
    body: Joi.object({
      account: Joi.string().length(42).required(),
    }),
  },
  admin: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      newOwner: Joi.string().length(42).required(),
    }),
  },
  approve: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      account: Joi.string().length(42).required(),
      amount: Joi.number().min(0).required(),
    }),
  },
};

module.exports = schema;
