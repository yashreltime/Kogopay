import BN from 'bignumber.js';
import axios from 'axios';

import getWeb3Instance from './customWeb3';
import config from '../config/env';
import contracts from '../constants/contractDetails.js';
import { processValue } from './dataFormatter';
import { getBTCBalance } from './btcServices';
import logger from '../middleware/logger';

const PROPOSAL = 'PROPOSAL';

const getContractInstance = async (code) => {
  let chain = 'RTC';
  let abi, address;
  if (code.includes('_ESCROW')) {
    const parts = code.split('_ESCROW');
    abi = contracts.ESCROWS.abi;
    address = contracts.ESCROWS.address[parts[0]];
  } else if (Object.keys(contracts.TOKENS).includes(code)) {
    abi = contracts.TOKENS[code].abi;
    address = contracts.TOKENS[code].address;
    chain = contracts.TOKENS[code].chain;
  } else {
    abi = contracts[code].abi;
    address = contracts[code].address;
  }
  const web3 = await getWeb3Instance(chain);
  return await new web3.eth.Contract(abi, address);
};

const getOwner = async (contract) => {
  const myContract = await getContractInstance(contract);
  const owner = await myContract.methods.owner().call();
  return owner;
};

const getAdminShare = async (contract) => {
  const myContract = await getContractInstance(contract);
  const share = await myContract.methods.getAdminShare().call();
  const decimals = await getDecimals(contract);
  const data = processValue(share, decimals);
  return data;
};

const getBalance = async (from, coinCode) => {
  try {
    let balance;
    let web3;
    //Finding chain id from coin code
    if (coinCode !== 'BTC') {
      web3 = await getWeb3Instance(contracts.TOKENS[coinCode].chain);
    }
    if (['RTC', 'ETH', 'BNB'].includes(coinCode)) {
      balance = await web3.eth.getBalance(from);
    } else if (coinCode === 'BTC') {
      balance = await getBTCBalance(from);
    } else {
      const myContract = await getContractInstance(coinCode);
      balance = await myContract.methods.balanceOf(from).call();
    }
    const decimals = await getDecimals(coinCode);
    balance = processValue(balance, decimals);
    return balance;
  } catch (err) {
    logger.error(err);
    throw new Error('Error fetching balance!');
  }
};

const getBalanceOfBatch = async (addresses, coinCode) => {
  const balancePromi = [];
  const fiatBalances = [];
  addresses.forEach((address) => {
    balancePromi.push(getBalance(address, coinCode));
  });
  const tokenBalances = await Promise.all(balancePromi);
  let code;
  switch (coinCode) {
    case 'RTC':
      code = 'ERTC';
      break;
    case 'ERTC':
      code = 'RTC';
      break;
    case 'ETH':
      code = 'WETH';
      break;
    case 'USDT':
      code = 'WUSDT';
      break;
    case 'USDC':
      code = 'WUSDC';
      break;
    case 'BNB':
      code = 'WBNB';
      break;
    case 'BTC':
      code = 'WBTC';
      break;
    default:
      code = coinCode;
      break;
  }
  const unitPrice = await getUnitPrice(code);
  tokenBalances.forEach((balance) => {
    fiatBalances.push((balance * unitPrice).toFixed(2));
  });
  return {
    tokenBalances,
    fiatBalances,
    unitPrice,
    coinCode,
  };
};

const getUnitPrice = async (token) => {
  const contract = await getContractInstance('SWAP');
  const web3 = await getWeb3Instance('RTC');
  const tokenBytes32 = web3.utils.keccak256(token);
  const result = await contract.methods.fetchTokenPrice(tokenBytes32).call();
  const decimals = await getDecimals(token);
  const unitPrice = BN(result)
    .div(BN(10 ** decimals))
    .toString();
  return unitPrice;
};

const getDecimals = async (code) => {
  let data;
  const marketContracts = ['PROPOSAL', 'VAULT', `${code}_ESCROW`, 'PAYMENT', 'REGISTRY'];
  if (marketContracts.includes(code)) {
    code = 'REGISTRY';
    const myContract = await getContractInstance(code);
    data = await myContract.methods.DECIMALS().call();
  } else if (Object.keys(contracts.TOKENS).includes(code)) {
    data = contracts.TOKENS[code].decimals;
  } else {
    data = 18;
  }
  return data;
};

const isContractAdmin = async (from, contract) => {
  const owner = await getOwner(contract);
  return owner === from;
};

const confirmAdmin = async (from, contract) => {
  const verified = isContractAdmin(from, contract);
  if (verified) {
    return true;
  }
  throw new Error('ADMIN_ONLY');
};

const verifyAdmin = async (from) => {
  if (from.toLowerCase() === contracts.TOKENS.RTO.address.toLowerCase()) {
    return true;
  }
  throw new Error('ADMIN_ONLY');
};

const verifyUser = async (user) => {
  const verified = await isUser(user);
  if (verified) {
    return true;
  }
  throw new Error('INVALID_USER');
};

const isUser = async (user) => {
  const myContract = await getContractInstance(PROPOSAL);
  const data = await myContract.methods.isUser(user).call();
  return data;
};

const isProposal = async (proposalId) => {
  const myContract = await getContractInstance('PROPOSAL');
  const data = await myContract.methods.isProposal(proposalId).call();
  return data;
};

const verifyProposal = async (proposalId) => {
  const verified = await isProposal(proposalId);
  if (verified) {
    return true;
  }
  throw new Error('INVALID_PROPOSAL');
};

const calculateTotalAmount = (P, R, n) => {
  //P = Loan Amount
  //R = Annual interest rate in percentage
  //i = monthly interest rate
  //n = number of payments/ duration in months
  if (!Number(R)) return P;

  const i = BN(R).div(BN(12).times(BN(100)));
  //factor = (1+i)^n
  const factor = BN(i.plus(BN(1))).pow(BN(n));
  const numerator = i.times(factor);
  const denominator = factor.minus(BN(1));
  const monthlyTotalPayment = BN(P).times(numerator).div(denominator);
  const totalAmount = monthlyTotalPayment.times(n);
  return totalAmount.toString();
};

const sendNotification = async (txnHash) => {
  try {
    logger.info('Sending notification to user');
    const body = { txnHash };
    const { URL, NOTIFICATION_ENDPOINT, API_KEY } = config.BACKEND;
    const apiKey = Buffer.from(API_KEY).toString('base64');
    const api_config = {
      headers: { Authorization: apiKey },
    };
    const result = await axios.post(URL + NOTIFICATION_ENDPOINT, body, api_config);
    logger.info('Notification sent successfully!');
    return;
  } catch (err) {
    logger.error(err);
    throw new Error('Error sending notification.');
  }
};

module.exports = {
  getContractInstance,
  getOwner,
  getAdminShare,
  getBalance,
  getBalanceOfBatch,
  getDecimals,
  isContractAdmin,
  confirmAdmin,
  verifyAdmin,
  verifyUser,
  isUser,
  verifyProposal,
  isProposal,
  calculateTotalAmount,
  sendNotification,
};