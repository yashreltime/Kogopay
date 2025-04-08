import contracts from '../constants/contractDetails.js';
import { getBigNumberObject, signTxnWithKMS } from './transactionServices';
import {
  getContractInstance,
  confirmAdmin,
  calculateTotalAmount,
} from '../services/commonServices';

const PROPOSAL = 'PROPOSAL';
const REGISTRY = 'REGISTRY';

const calculateEarnings = async (amount, interest, duration, decimals) => {
  const myContract = await getContractInstance(PROPOSAL);
  const amountInHex = getBigNumberObject(amount, decimals);
  const interestRateInHex = getBigNumberObject(interest, decimals);
  const totalAmount = calculateTotalAmount(amount, interest, duration);
  const totalAmountInHex = getBigNumberObject(totalAmount, decimals);
  const data = await myContract.methods
    .calcEarningsTable(amountInHex, totalAmountInHex, interestRateInHex, duration)
    .call();
  return data;
};

const getContractParameters = async () => {
  const myContract = await getContractInstance(REGISTRY);
  const data = await myContract.methods.getContractParameters().call();
  return data;
};
const updateCollateralPercentage = async (from, percentage) => {
  const myContract = await getContractInstance(REGISTRY);
  await confirmAdmin(from, REGISTRY);
  const to = contracts[REGISTRY].address;
  const gasLimit = await myContract.methods.updateCollateralPercentage(percentage).estimateGas({
    from,
  });
  const data = await myContract.methods.updateCollateralPercentage(percentage).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const updateCollateralIntrestFactor = async (from, factor) => {
  const myContract = await getContractInstance(REGISTRY);
  await confirmAdmin(from, REGISTRY);
  const to = contracts[REGISTRY].address;
  const gasLimit = await myContract.methods.updateCollateralInterestChange(factor).estimateGas({
    from,
  });
  const data = await myContract.methods.updateCollateralInterestChange(factor).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const updateDelayedInstalmentLimit = async (from, count) => {
  const myContract = await getContractInstance(REGISTRY);
  await confirmAdmin(from, REGISTRY);
  const to = contracts[REGISTRY].address;
  const gasLimit = await myContract.methods.updateDelayedInstalmentsCount(count).estimateGas({
    from,
  });
  const data = await myContract.methods.updateDelayedInstalmentsCount(count).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

module.exports = {
  calculateEarnings,
  getContractParameters,
  updateCollateralPercentage,
  updateCollateralIntrestFactor,
  updateDelayedInstalmentLimit,
};
