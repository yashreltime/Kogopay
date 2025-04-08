import { default as Common } from '@ethereumjs/common';
import BigNumber from 'bignumber.js';
import { Transaction } from 'ethereumjs-tx';
import * as bitcoinLib from 'bitcoinjs-lib';
import axios from 'axios';

import getWeb3Instance from './customWeb3';
import { getContractInstance, sendNotification } from './commonServices';
import network from '../constants/networks';
import config from '../config/env';
import logger from '../middleware/logger';
import contracts from '../constants/contractDetails.js';
import txnServices from './transactionServices';
import { publishToQueue } from './queueServices';
import Mint from '../models/mintTxnSchemaModel';
import Burn from '../models/burnTxnSchemaModel';
import BTCAccount from '../models/btcAccount';
import DB_CONSTANTS from '../constants/dbConstants';
import { syncDb, getNonce } from './nonceManagerService';
import kmsServices from './kmsServices';
import btcServices from './btcServices';
import { insertSwapRequestToDB, swapOrganizer } from './swappingServices';

const queueManager = async (data) => {
  switch (data.type) {
    case 'mint':
      await insertMintRequestToDB({ ...data });
      await sendWrappedTokens(data);
      break;
    case 'burn':
      await insertBurnRequestToDB({ ...data });
      await burningOrganizer(data);
      break;
    case 'swap':
      await insertSwapRequestToDB({ ...data });
      await swapOrganizer(data);
      break;
    default:
      logger.error('Invalid bridge/swap request received!');
  }
};

const pushToQueue = async (data) => {
  logger.info('Bridge request received, pushing to queue!');
  await publishToQueue(data);
  return;
};

const insertMintRequestToDB = async (data) => {
  const { fromAddress, txHash, code } = data;
  const coinCode = getCrossChainCode(code);
  await Mint.findOneAndUpdate(
    { _id: txHash },
    {
      $set: {
        _id: txHash,
        fromAddress,
        code: coinCode,
        raw: data,
      },
    },
    { upsert: true }
  );
  logger.info('Mint request added to DB.');
  return;
};

const insertBurnRequestToDB = async (data) => {
  const { fromAddress, txHash, code } = data;
  const coinCode = getCrossChainCode(code);
  await Burn.findOneAndUpdate(
    { _id: txHash },
    {
      $set: {
        _id: txHash,
        fromAddress,
        code: coinCode,
        raw: data,
      },
    },
    { upsert: true }
  );
  logger.info('Burn request added to DB.');
  return;
};

const getCrossChainCode = (code) => {
  let coinCode;
  switch (code) {
    case 'ETH':
      coinCode = 'WETH';
      break;
    case 'USDT':
      coinCode = 'WUSDT';
      break;
    case 'USDC':
      coinCode = 'WUSDC';
      break;
    case 'ERTC':
      coinCode = 'RTC';
      break;
    case 'BNB':
      coinCode = 'WBNB';
      break;
    case 'BTC':
      coinCode = 'WBTC';
      break;
    case 'WETH':
      coinCode = 'ETH';
      break;
    case 'WUSDT':
      coinCode = 'USDT';
      break;
    case 'WUSDC':
      coinCode = 'USDC';
      break;
    case 'RTC':
      coinCode = 'ERTC';
      break;
    case 'WBNB':
      coinCode = 'BNB';
      break;
    case 'WBTC':
      coinCode = 'BTC';
      break;
  }
  return coinCode;
};

const getAdminAddress = (code) => {
  return contracts.TOKENS[code].admin;
};

//Todo Need to find users WBTC address
const sendWrappedTokens = async (payload) => {
  const txn = await Mint.findOne({ _id: payload.txHash });
  const keys = Object.keys(txn);
  if ((keys.length && txn.status === DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED) || !keys.length) {
    try {
      await Mint.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.PROCESSING }
      );
      const web3 = await getWeb3Instance('RTC');
      let { code, fromAddress: receiver, value: amount } = payload;
      let receipt;
      const coinCode = getCrossChainCode(code);
      if (coinCode === 'RTC') {
        const serializedTx = await txnServices.buyRTC(receiver, amount, coinCode);
        receipt = await web3.eth.sendSignedTransaction(serializedTx);
      } else {
        if (code === 'BTC') {
          receiver = await getCrossChainAddress(code, payload.fromAddress);
        }
        const admin = getAdminAddress(coinCode);
        const myContract = await getContractInstance(coinCode);
        const decimals = 18;
        const to = contracts.TOKENS[coinCode].address;
        const amountInHex = txnServices.getBigNumberObject(amount, decimals);
        const gasLimit = await myContract.methods.mint(receiver, amountInHex).estimateGas({
          from: admin,
        });
        const data = await myContract.methods
          .mint(receiver, amountInHex)
          .encodeABI({ from: admin });
        const serializedTx = await txnServices.signTxnWithKMS(admin, to, gasLimit, data, coinCode);
        receipt = await web3.eth.sendSignedTransaction(serializedTx);
      }
      await Mint.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.PROCESSED }
      );
      logger.info(`Successfully minted ${coinCode}: ${receipt.transactionHash}`);
      //To send notification to backend
      await sendNotification(payload.txHash);
    } catch (e) {
      logger.error(`Minting  failed : ${e} `);
      await Mint.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED },
        { $inc: { tries: 1 } }
      );
      await syncDb();
    }
  }
  return;
};

const burningOrganizer = async (payload) => {
  const txn = await Burn.findOne({ _id: payload.txHash });
  const keys = Object.keys(txn);
  if ((keys.length && txn.status === DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED) || !keys.length) {
    try {
      await Burn.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.PROCESSING }
      );
      switch (payload.code) {
        case 'WETH':
          await sendEthereum(payload);
          break;
        case 'WBNB':
          await sendBinance(payload);
          break;
        case 'WBTC':
          await sendBitcoin(payload);
          break;
        default:
          await sendTokensOnEthereum(payload);
          break;
      }
      await syncDb();
      if (payload.code !== 'RTC') {
        await burnTokens(payload);
      }
      await Burn.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.PROCESSED }
      );
      //To send notification to backend
      await sendNotification(payload.txHash);
    } catch (e) {
      logger.error(`${payload.code} Burning Failed: ${e} `);
      await Burn.findOneAndUpdate(
        { _id: payload.txHash },
        { status: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED },
        { $inc: { tries: 1 } }
      );
      await syncDb();
    }
  }
  return;
};

const burnTokens = async (payload) => {
  try {
    const web3 = await getWeb3Instance('RTC');
    const { code, value: amount } = payload;
    const admin = contracts.TOKENS[code].address;
    const myContract = await getContractInstance(code);
    const decimals = 18;
    const to = contracts.TOKENS[code].address;
    const amountInHex = txnServices.getBigNumberObject(amount, decimals);
    const gasLimit = await myContract.methods.burn(admin, amountInHex).estimateGas({
      from: admin,
    });
    const data = await myContract.methods.burn(admin, amountInHex).encodeABI({ from: admin });
    const serializedTx = await txnServices.signTxnWithKMS(admin, to, gasLimit, data, code);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    logger.info(`Successfully burned ${code}: ${receipt.transactionHash}`);
    await Burn.findOneAndUpdate(
      { _id: payload.txHash },
      { burnStatus: DB_CONSTANTS.BURN_STATUS.BURNED }
    );
  } catch (e) {
    logger.error(`Burning failed : ${e} `);
    await syncDb();
  }
};

const sendEthereum = async (payload) => {
  logger.info(`Sending ETH...`);
  const web3 = await getWeb3Instance('ETH');
  const { code, fromAddress: to, value } = payload;
  const coinCode = getCrossChainCode(code);
  const admin = getAdminAddress(coinCode);
  const decimals = contracts.TOKENS[code].decimals;
  const nonceCount = await getNonce(coinCode, admin);
  const gasLimit = 50000;
  let gasPrice = await web3.eth.getGasPrice();
  gasPrice = parseInt(gasPrice) + 8000000000;

  const txObject = {
    from: admin,
    to,
    nonce: await web3.utils.toHex(nonceCount),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: await web3.utils.toHex(gasLimit),
    value: calculateTotalEth(value, decimals, gasLimit, gasPrice),
  };

  const serializedTx = await signBuildedTxnWithKMS(txObject, 'ETH', coinCode);
  const receipt = await web3.eth.sendSignedTransaction(serializedTx);
  logger.info(`Successfully transferred ETH: ${receipt.transactionHash}`);
  return;
};

const sendTokensOnEthereum = async (payload) => {
  const web3 = await getWeb3Instance('ETH');
  const { code, fromAddress: receiver, value: amount } = payload;
  const coinCode = getCrossChainCode(code);
  const admin = getAdminAddress(coinCode);
  logger.info(`Sending ${coinCode}...`);
  const myContract = await getContractInstance(coinCode);
  const decimals = contracts.TOKENS[coinCode].decimals;
  const to = contracts.TOKENS[coinCode].address;
  const amountInHex = txnServices.getBigNumberObject(amount, decimals);
  const nonceCount = await getNonce(coinCode, admin);
  let gasPrice = await web3.eth.getGasPrice();
  gasPrice = parseInt(gasPrice) + 8000000000;
  const gasLimit = await myContract.methods.transfer(receiver, amountInHex).estimateGas({
    from: admin,
  });
  const data = await myContract.methods.transfer(receiver, amountInHex).encodeABI({ from: admin });

  const txObject = {
    from: admin,
    to,
    nonce: await web3.utils.toHex(nonceCount),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: await web3.utils.toHex(gasLimit),
    value: '0x',
    data,
  };

  const serializedTx = await signBuildedTxnWithKMS(txObject, 'ETH', coinCode);
  const receipt = await web3.eth.sendSignedTransaction(serializedTx);
  logger.info(`Successfully transferred ${coinCode}: ${receipt.transactionHash}`);
  return;
};

const calculateTotalEth = (amount, decimals, gasLimit, gasPrice) => {
  const BNAmount = BigNumber(amount).multipliedBy(BigNumber(10 ** decimals));
  //TO take transfer fee from sending amount.Only rest will be sent to receiver.
  // const BNGasLimit = BigNumber(gasLimit);
  // const BNGasPrice = BigNumber(gasPrice);
  // const BNTotalAmount = BNAmount.minus(BNGasLimit.multipliedBy(BNGasPrice));

  //To take transfer fee from ADMIN
  const BNTotalAmount = BNAmount;

  if (BNTotalAmount.lte(0)) {
    throw new Error('Insufficient amount!');
  }
  return '0x' + BNTotalAmount.toString(16);
};

const sendBinance = async (payload) => {
  logger.info(`Sending BNB...`);
  const web3 = await getWeb3Instance('BNB');
  const { code, fromAddress: to, value } = payload;
  const coinCode = getCrossChainCode(code);
  const admin = getAdminAddress(coinCode);
  const decimals = contracts.TOKENS[code].decimals;
  const nonceCount = await getNonce(coinCode, admin);
  const gasLimit = 50000;
  const gasPrice = await web3.eth.getGasPrice();
  const txObject = {
    from: admin,
    to,
    nonce: await web3.utils.toHex(nonceCount),
    gasPrice: web3.utils.toHex(gasPrice),
    gasLimit: await web3.utils.toHex(gasLimit),
    value: calculateTotalEth(value, decimals, gasLimit, gasPrice),
  };

  const serializedTx = await signBuildedTxnWithKMS(txObject, 'BNB', coinCode);
  const receipt = await web3.eth.sendSignedTransaction(serializedTx);
  logger.info(`Successfully transferred BNB: ${receipt.transactionHash}`);
  return;
};

//Todo Need to find users bitcoin address
const sendBitcoin = async (payload) => {
  let { code, fromAddress: receiver, value } = payload;
  const coinCode = getCrossChainCode(code);
  const admin = getAdminAddress(coinCode);
  const fromWallet = await BTCAccount.findOne({ address: admin });
  if (!fromWallet) {
    throw Error('Please setup an ADMIN first!');
  }
  const btcClient = btcServices.getBtcClient();
  const networkName = network.BTC[config.NETWORK].name;
  const networkObj = bitcoinLib.networks[networkName];

  const keypair = await btcServices.getKeyPairFromWIF(fromWallet.private);
  const tx = new bitcoinLib.Psbt({ network: networkObj });
  let balance = 0;

  const utxoConfig = { minconf: 1, maxconf: 100, addresses: [admin], include_unsafe: false };
  const utxos = await btcClient.listunspent(utxoConfig);
  if (!utxos || !utxos.length) {
    throw Error('Waiting for last transaction confirmation for ADMIN');
  }
  await Promise.all(
    utxos.map(async (txn) => {
      const rawTxn = await btcServices.getBlockHash(txn.txid);
      balance += txn.amount * 100000000;
      tx.addInput({
        hash: txn.txid,
        index: txn.vout,
        nonWitnessUtxo: new Buffer.from(rawTxn.hex, 'hex'),
      });
    })
  );
  const investment = value * 100000000;
  const fee = 1000; //In satoshis
  const tAmount = parseInt(investment - fee);
  const rAmount = parseInt(balance - investment);
  if (rAmount < 0) {
    throw Error('Insufficient BTC balance on ADMIN');
  }
  tx.addOutput({ address: receiver, value: tAmount });
  tx.addOutput({ address: admin, value: rAmount });
  await tx.signAllInputsAsync(keypair);
  tx.validateSignaturesOfAllInputs(btcServices.validator);
  tx.finalizeAllInputs();
  const txhex = tx.extractTransaction().toHex();
  const receipt = await btcClient.sendrawtransaction({ hexstring: txhex });
  logger.info(`Successfully transferred ${coinCode}: ${receipt}`);
  return;
};

const getCrossChainAddress = async (chain, address) => {
  try {
    logger.info('Fetching user address.');
    const body = {};
    body[chain] = address;
    const { URL, ADDRESS_ENDPOINT, API_KEY } = config.BACKEND;
    const apiKey = Buffer.from(API_KEY).toString('base64');
    const api_config = {
      headers: { Authorization: apiKey },
    };
    const result = await axios.post(URL + ADDRESS_ENDPOINT, body, api_config);
    logger.info(`Fetched user address : ${result.data.RTC}`);
    return result.data.RTC;
  } catch (err) {
    logger.error(err);
    throw new Error('Error fetching the user address.');
  }
};

const signBuildedTxnWithKMS = async (rawTransaction, chain, key) => {
  const fetchSign = await kmsServices.fetchSignature(key);

  // Setting up r,s,v in rawTransaction
  rawTransaction.r = fetchSign.r;
  rawTransaction.s = fetchSign.s;
  rawTransaction.v = fetchSign.v;

  const common = Common.custom(network[chain][config.NETWORK]);
  const tx = new Transaction(rawTransaction, {
    common,
  });

  const txHash = tx.hash(false);
  const serializedTx = await kmsServices.fetchSerializedTx(txHash, tx, key);
  return serializedTx;
};

module.exports = {
  queueManager,
  pushToQueue,
  sendWrappedTokens,
  burningOrganizer,
  getCrossChainAddress,
};
