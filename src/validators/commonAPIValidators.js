import { Joi } from 'express-validation';

const schema = {
  adminShare: {
    params: Joi.object({
      contract: Joi.string().valid('RTC', 'RTO', 'PROPOSAL').required(),
    }),
  },
  updateAdminShare: {
    body: Joi.object({
      contract: Joi.string().valid('RTC', 'RTO', 'PROPOSAL', 'REGISTRY').required(),
      share: Joi.number().min(0).required(),
      from: Joi.string().length(42).required(),
    }),
  },

  balance: {
    body: Joi.object({
      coinCode: Joi.string().required(),
      from: Joi.alternatives()
        .conditional('coinCode', {
          is: 'BTC',
          then: Joi.string().length(34).required(),
          otherwise: Joi.string().length(42).optional(),
        })
        .required(),
    }),
  },
  batchBalance: {
    body: Joi.object({
      coinCode: Joi.string().required(),
      addresses: Joi.alternatives()
        .conditional('coinCode', {
          is: 'BTC',
          then: Joi.array().items(Joi.string().length(34)).required(),
          otherwise: Joi.array().items(Joi.string().length(42)).required(),
        })
        .required(),
    }),
  },
  owner: {
    params: Joi.object({
      contract: Joi.string().valid('RTC', 'RTO', 'PROPOSAL').required(),
    }),
  },
};

module.exports = schema;
