import customDataModel from '../models/customDataModel';
import BigNumber from 'bignumber.js';

const formatter = async (model, payload, decimals = 18) => {
  const data = {};
  const ref = customDataModel[model];
  const requiredLength = Object.keys(payload).length / 2;
  for (let i = 0; i < requiredLength; i++) {
    const paramObj = ref[i];
    const key = paramObj.key;
    const value = paramObj.needProcessing ? processValue(payload[i], decimals) : payload[i];
    if (paramObj.type === 'enum') {
      data[key] = customDataModel[key][value].key;
    } else if (paramObj.type === 'object') {
      data[key] = await formatter(key, value, decimals);
    } else {
      data[key] = value;
    }
  }
  return data;
};

const processValue = (value, decimals) => {
  return BigNumber(value)
    .div(BigNumber(10 ** decimals))
    .toFixed(8, BigNumber.ROUND_CEIL)
    .toString();
};

const arrayFormatter = async (model, payload, decimals = 18) => {
  const data = [];
  const length = payload.length;
  for (let i = 0; i < length; i++) {
    const formattedArray = await formatter(model, payload[i], decimals);
    data.push(formattedArray);
  }
  return data;
};

module.exports = { formatter, arrayFormatter, processValue };
