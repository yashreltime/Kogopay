import boolParams from '../config/booleans';

const boolInterceptor = (req, res, next) => {
  const params = Object.keys(req.body);
  params.forEach((param) => {
    const index = boolParams.indexOf(param);
    if (index >= 0 && typeof req.body[param] === 'string') {
      req.body[param] = boolCheck(req.body[param]);
    }
  });
  next();
};

const boolCheck = (val) => {
  if (val === 'True' || val === 'true') {
    return true;
  } else {
    return false;
  }
};

module.exports = boolInterceptor;
