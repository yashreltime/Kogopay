import { Joi } from 'express-validation';

const schema = {
  create: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      user: Joi.string().length(42).required(),
    }),
  },
  remove: {
    body: Joi.object({
      from: Joi.string().length(42).required(),
      user: Joi.string().length(42).required(),
    }),
  },
  address: {
    params: Joi.object({
      index: Joi.number().integer().min(0).required(),
    }),
  },
  details: {
    params: Joi.object({
      user: Joi.string().length(42).required(),
    }),
  },
};

module.exports = schema;
