import { default as Common } from '@ethereumjs/common';
import { Transaction as Tx } from '@ethereumjs/tx';
import BigNumber from 'bignumber.js';
import { Transaction } from 'ethereumjs-tx';

import config from '../config/env';
import web3 from './web3.js';
import getCustomWeb3 from './customWeb3';
import contracts from '../constants/contractDetails.js';
import network from '../constants/networks';
import { getContractInstance, getBalance, getDecimals } from './commonServices';
import kmsServices from '../services/kmsServices';
import { getNonce } from './nonceManagerService';
import { processValue } from '../services/dataFormatter';

const getRawTransaction = async (from, to, gasLimit, data, coinCode = 'RTC', value = '0x0') => {
  const nonceCount = await getNonce(coinCode, from);
  const txObject = {
    from,
    to,
    nonce: await web3.utils.toHex(nonceCount),
    gasPrice: '0x0',
    gasLimit: await web3.utils.toHex(gasLimit),
    value,
    data,
  };
  return txObject;
};

const buildTransaction = async (from, to, gasLimit, data, coinCode = 'RTC', value = '0x0') => {
  const txObject = await getRawTransaction(from, to, gasLimit, data, coinCode, value);
  const common = Common.custom(network.RTC[config.NETWORK]);
  return Tx.fromTxData(txObject, {
    common,
  });
};

const buyRTC = async (to, amount, coinCode) => {
  const from = contracts.TOKENS[coinCode].admin;

  await checkBalance(from, amount, coinCode);

  const decimals = await getDecimals(coinCode);
  const nonce_count = await getNonce(coinCode, from);
  const value = getBigNumberObject(amount, decimals);
  const gasLimit = 21000;

  const txObject = {
    from,
    to,
    nonce: await web3.utils.toHex(nonce_count),
    gasPrice: '0x0',
    gasLimit: await web3.utils.toHex(gasLimit),
    value,
  };

  //KMS signing
  const fetchSign = await kmsServices.fetchSignature(coinCode);

  // Setting up r,s,v in rawTransaction
  txObject.r = fetchSign.r;
  txObject.s = fetchSign.s;
  txObject.v = fetchSign.v;

  const common = Common.custom(network.RTC[config.NETWORK]);
  const tx = new Transaction(txObject, {
    common,
  });

  const txHash = tx.hash(false);
  const serializedTx = await kmsServices.fetchSerializedTx(txHash, tx, coinCode);
  return serializedTx;
};

const buyRTO = async (to, amount, coinCode) => {
  const from = contracts.TOKENS[coinCode].admin;
  const myContract = await getContractInstance(coinCode);
  await checkBalance(from, amount, coinCode);

  const decimals = await getDecimals(coinCode);
  const nonce_count = await getNonce(coinCode, from);
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods.transfer(to, amountInHex).estimateGas({
    from,
  });
  const data = await myContract.methods.transfer(to, amountInHex).encodeABI();

  const txObject = {
    from,
    to: contracts.TOKENS[coinCode].address,
    nonce: await web3.utils.toHex(nonce_count),
    gasPrice: '0x0',
    gasLimit: await web3.utils.toHex(gasLimit),
    value: '0x0',
    data,
  };

  //KMS signing
  const fetchSign = await kmsServices.fetchSignature(coinCode);

  // Setting up r,s,v in rawTransaction
  txObject.r = fetchSign.r;
  txObject.s = fetchSign.s;
  txObject.v = fetchSign.v;

  const common = Common.custom(network.RTC[config.NETWORK]);
  const tx = new Transaction(txObject, {
    common,
  });
  const txHash = tx.hash(false);
  const serializedTx = await kmsServices.fetchSerializedTx(txHash, tx, coinCode);
  return serializedTx;
};

const refill = async (amount, coinCode) => {
  const receiver = contracts.TOKENS[coinCode].admin;
  let from = config.ADMIN_ADDRESS;
  const myContract = await getContractInstance(coinCode);

  if (coinCode === 'RTC') {
    await checkBalance(contracts.TOKENS.RTC.address, amount, coinCode);
  } else {
    await checkBalance(from, amount, coinCode);
  }
  const decimals = 18;
  const to = contracts.TOKENS[coinCode].address;
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods.transfer(receiver, amountInHex).estimateGas({
    from,
  });
  const data = await myContract.methods.transfer(receiver, amountInHex).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const approveTransaction = async (from, spender, amount, coinCode, action) => {
  const myContract = await getContractInstance(coinCode);

  await checkBalance(from, amount, coinCode);

  const decimals = 18;
  const to = contracts.TOKENS[coinCode].address;
  const amountInHex = getBigNumberObject(amount, decimals);
  let gasLimit;
  let data;
  switch (action) {
    case 'ADD':
      gasLimit = await myContract.methods.approve(spender, amountInHex).estimateGas({
        from,
      });
      data = await myContract.methods.approve(spender, amountInHex).encodeABI();
      break;
    case 'INC':
      gasLimit = await myContract.methods.increaseAllowance(spender, amountInHex).estimateGas({
        from,
      });
      data = await myContract.methods.increaseAllowance(spender, amountInHex).encodeABI();
      break;
    case 'DEC':
      gasLimit = await myContract.methods.decreaseAllowance(spender, amountInHex).estimateGas({
        from,
      });
      data = await myContract.methods.decreaseAllowance(spender, amountInHex).encodeABI();
      break;
    default:
      break;
  }
  const txObject = await buildTransaction(from, to, gasLimit, data);
  return txObject;
};

const getAllowance = async (from, spender, coinCode) => {
  const myContract = await getContractInstance(coinCode);
  const allowance = await myContract.methods.allowance(from, spender).call({ from });
  const decimals = await getDecimals(coinCode);
  return processValue(allowance, decimals);
};

const checkBalance = async (from, amount, coinCode) => {
  const balance = await getBalance(from, coinCode);
  if (BigNumber(balance).lt(BigNumber(amount))) {
    if (coinCode === 'RTC' || coinCode === 'RTO') {
      throw new Error(`INSUFFICIENT_${coinCode}_BALANCE`);
    } else {
      throw new Error(
        `Insufficient ${coinCode} Balance. Please recharge the account before trying again.`
      );
    }
  }
  return;
};

const getBigNumberObject = (amount, decimals = 18) => {
  if (!amount) return 0;
  return (
    '0x' +
    BigNumber(amount)
      .multipliedBy(BigNumber(10 ** decimals))
      .dp(0)
      .toString(16)
  );
};

const signTxnWithKMS = async (from, to, gasLimit, data, key) => {
  const fetchSign = await kmsServices.fetchSignature(key);
  const rawTransaction = await getRawTransaction(from, to, gasLimit, data, key);
  // Setting up r,s,v in rawTransaction
  rawTransaction.r = fetchSign.r;
  rawTransaction.s = fetchSign.s;
  rawTransaction.v = fetchSign.v;

  const common = Common.custom(network.RTC[config.NETWORK]);
  const tx = new Transaction(rawTransaction, {
    common,
  });
  const txHash = tx.hash(false);
  const serializedTx = await kmsServices.fetchSerializedTx(txHash, tx, key);
  return serializedTx;
};

//! REMOVE
const mock = async (key) => {
  return kmsServices.fetchSignature(key);
};

//! REMOVE
const signTxnTest = async (chain, signer, txnBuild) => {
  const common = Common.custom(network[chain][config.NETWORK]);
  const txn = Tx.fromTxData(txnBuild, { common });
  let privateKey;
  if (signer == 'LENDER') {
    privateKey = Buffer.from(process.env.ADMIN1_PRIVATE_KEY, 'hex');
  } else if (signer == 'BORROWER') {
    privateKey = Buffer.from(process.env.ADMIN2_PRIVATE_KEY, 'hex');
  } else if (signer == 'REJECTOR') {
    privateKey = Buffer.from(process.env.ADMIN3_PRIVATE_KEY, 'hex');
  } else if (signer == 'TESTER') {
    privateKey = Buffer.from(process.env.ADMIN4_PRIVATE_KEY, 'hex');
  }
  const signedTxn = txn.sign(privateKey);
  const serializedTx = signedTxn.serialize();
  //console.log("signTxnTest: serilaized Txn: ",'0x' + serializedTx.toString('hex'));
  const customWeb3 = await getCustomWeb3(chain);
  const receipt = await customWeb3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
  return receipt;
};

module.exports = {
  buildTransaction,
  buyRTC,
  buyRTO,
  refill,
  approveTransaction,
  getAllowance,
  signTxnWithKMS,
  checkBalance,
  getBigNumberObject,
  //! REMOVE
  mock,
  signTxnTest,
};
