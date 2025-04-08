import BigNumber from 'bignumber.js';

import web3 from './web3';
import config from '../config/env';
import logger from '../middleware/logger';
import contracts from '../constants/contractDetails.js';
import txnServices from './transactionServices';
import { getContractInstance, getDecimals, sendNotification } from './commonServices';
import { publishToQueue } from './queueServices';
import Swap from '../models/swapTxnSchemaModel';
import DB_CONSTANTS from '../constants/dbConstants';
import { syncDb } from './nonceManagerService';

const SWAP = 'SWAP';
const SWAP_ORACLE = 'SWAP_ORACLE';
const RTC = 'RTC';

const getUnitPrice = async (token) => {
  const contract = await getContractInstance(SWAP);
  const tokenBytes32 = web3.utils.keccak256(token);
  const result = await contract.methods.fetchTokenPrice(tokenBytes32).call();
  const decimals = await getDecimals(token);
  const unitPrice = BigNumber(result)
    .div(BigNumber(10 ** decimals))
    .toString();
  return unitPrice;
};

const getSwapSummary = async (fromToken, toToken, fromAmount = 0, toAmount = 0) => {
  const contract = await getContractInstance(SWAP);
  const fromTokenBytes32 = web3.utils.keccak256(fromToken);
  const toTokenBytes32 = web3.utils.keccak256(toToken);
  const fromAmountBNHex = txnServices.getBigNumberObject(fromAmount);
  const toAmountBNHex = txnServices.getBigNumberObject(toAmount);
  const summary = await contract.methods
    .tokenCalculation(fromTokenBytes32, toTokenBytes32, fromAmountBNHex, toAmountBNHex)
    .call();
  return summary;
};

const getTokenAdminAddress = async (token) => {
  const contract = await getContractInstance(SWAP);
  const fromTokenBytes32 = web3.utils.keccak256(token);
  const admin = await contract.methods.getTokenAdminAddress(fromTokenBytes32).call();
  return admin;
};

const setTokenAdminAddress = async (token) => {
  const contract = await getContractInstance(SWAP);
  const admin = contracts.TOKENS[token].admin;
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP.address;
  const tokenBytes32 = web3.utils.keccak256(token);
  const gasLimit = await contract.methods.setTokenAdminAddress(tokenBytes32, admin).estimateGas({
    from,
  });
  const data = await contract.methods.setTokenAdminAddress(tokenBytes32, admin).encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const getTokenContractAddress = async (token) => {
  const contract = await getContractInstance(SWAP);
  const fromTokenBytes32 = web3.utils.keccak256(token);
  const contractAddress = await contract.methods.getTokenContractAddress(fromTokenBytes32).call();
  return contractAddress;
};

const setTokenContractAddress = async (token) => {
  const contract = await getContractInstance(SWAP);
  const contractAddress = contracts.TOKENS[token].address;
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP.address;
  const tokenBytes32 = web3.utils.keccak256(token);
  const gasLimit = await contract.methods
    .setTokenContractAddress(tokenBytes32, contractAddress)
    .estimateGas({
      from,
    });
  const data = await contract.methods
    .setTokenContractAddress(tokenBytes32, contractAddress)
    .encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const getOracleContractAddress = async () => {
  const contract = await getContractInstance(SWAP);
  const oracle = await contract.methods.getMarketRateOracleAddress().call();
  return oracle;
};

const setOracleContractAddress = async (oracle) => {
  const contract = await getContractInstance(SWAP);
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP.address;
  const gasLimit = await contract.methods.updateMarketRateOracleAddress(oracle).estimateGas({
    from,
  });
  const data = await contract.methods.updateMarketRateOracleAddress(oracle).encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const getOracleConsumerAddress = async () => {
  const contract = await getContractInstance(SWAP_ORACLE);
  const consumer = await contract.methods.getConsumerAddress().call();
  return consumer;
};

const getOracleLinkTokenAddress = async () => {
  const contract = await getContractInstance(SWAP_ORACLE);
  const consumer = await contract.methods.getChainlinkToken().call();
  return consumer;
};

const getOracleOwnerAddress = async () => {
  const contract = await getContractInstance(SWAP_ORACLE);
  const consumer = await contract.methods.owner().call();
  return consumer;
};

const setOracleConsumerAddress = async () => {
  const contract = await getContractInstance(SWAP_ORACLE);
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP_ORACLE.address;
  const consumer = contracts.SWAP.address;
  const gasLimit = await contract.methods.setConsumerAddress(consumer).estimateGas({
    from,
  });
  const data = await contract.methods.setConsumerAddress(consumer).encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const setOracleNodePermission = async () => {
  const contract = await getContractInstance(SWAP_ORACLE);
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP_ORACLE.address;
  const node = config.CHAINLINK_NODE;
  const gasLimit = await contract.methods.setNodePermission(node, true).estimateGas({
    from,
  });
  const data = await contract.methods.setNodePermission(node, true).encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const getSwapFee = async () => {
  const contract = await getContractInstance(SWAP);
  const fee = await contract.methods.getSwapFeePercentage().call();
  return BigNumber(fee)
    .div(BigNumber(10 ** 18))
    .toString();
};

const updateSwapAdminFee = async (fee) => {
  const contract = await getContractInstance(SWAP);
  const from = config.ADMIN_ADDRESS;
  const to = contracts.SWAP.address;
  const feeBNHex = txnServices.getBigNumberObject(fee);
  const gasLimit = await contract.methods.updateSwapFeePercentage(feeBNHex).estimateGas({
    from,
  });
  const data = await contract.methods.updateSwapFeePercentage(feeBNHex).encodeABI();
  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const approveSwapTxn = async (from, token, amount) => {
  const myContract = await getContractInstance(token);

  await checkBalance(from, token, amount);

  const decimals = 18;
  const to = contracts.TOKENS[token].address;
  const amountInHex = txnServices.getBigNumberObject(amount, decimals);
  const spender = contracts.SWAP.address;
  const gasLimit = await myContract.methods.approve(spender, amountInHex).estimateGas({
    from,
  });
  const data = await myContract.methods.approve(spender, amountInHex).encodeABI();

  const txObject = await txnServices.buildTransaction(from, to, gasLimit, data);
  return txObject;
};

const swap = async (id, from, fromToken, toToken, fromAmount, toAmount) => {
  const myContract = await getContractInstance(SWAP);
  const to = contracts.SWAP.address;
  const fromTknBytes32 = web3.utils.keccak256(fromToken);
  const toTknBytes32 = web3.utils.keccak256(toToken);
  const fromAmtBNHex = txnServices.getBigNumberObject(fromAmount);
  const toAmtBNHex = txnServices.getBigNumberObject(toAmount);
  const expirationTime = new Date().getTime() + 20 * 60 * 1000; //20 minutes
  const expTimeInHex = txnServices.getBigNumberObject(expirationTime);
  let value = '0x0';
  if (fromToken === RTC) {
    value = fromAmtBNHex;
  }
  const gasLimit = await myContract.methods
    .requestSwap(id, from, fromTknBytes32, toTknBytes32, fromAmtBNHex, toAmtBNHex, expTimeInHex)
    .estimateGas({
      from,
      value,
    });
  const data = await myContract.methods
    .requestSwap(id, from, fromTknBytes32, toTknBytes32, fromAmtBNHex, toAmtBNHex, expTimeInHex)
    .encodeABI({
      from,
      value,
    });
  const txn = await txnServices.buildTransaction(from, to, gasLimit, data, RTC, value);
  return txn;
};

const details = async (id) => {
  const myContract = await getContractInstance(SWAP);
  const details = await myContract.methods.swapRequests(id).call();
  return details;
};

const pushToQueue = async (data) => {
  logger.info('Swap request received, pushing to queue!');
  await publishToQueue(data);
  return;
};

const insertSwapRequestToDB = async (data) => {
  const { swapId, fromAddress, txHash, fromToken, toToken, fromAmount, toAmount } = data;
  await Swap.findOneAndUpdate(
    { _id: txHash },
    {
      $set: {
        _id: txHash,
        swapId,
        fromAddress,
        fromToken,
        fromAmount,
        toToken,
        toAmount,
        raw: data,
      },
    },
    { upsert: true }
  );
  logger.info('Swap request added to DB.');
  return;
};

const swapOrganizer = async (payload) => {
  const txn = await Swap.findOne({ _id: payload.txHash });
  const keys = Object.keys(txn);
  if ((keys.length && txn.status === DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED) || !keys.length) {
    try {
      await Swap.findOneAndUpdate(
        { _id: payload.txHash },
        { $set: { status: DB_CONSTANTS.TXN_STATUS.PROCESSING } }
      );
      if (payload.toToken === 'RTO') {
        const serializedTx = await txnServices.buyRTO(payload.fromAddress, payload.toAmount, 'RTO');
        const receipt = await web3.eth.sendSignedTransaction(serializedTx);
        logger.info(`Successfully transferred RTO: ${receipt.transactionHash}`);
      } else if (payload.toToken === 'RTC') {
        const serializedTx = await txnServices.buyRTC(payload.fromAddress, payload.toAmount, 'RTC');
        const receipt = await web3.eth.sendSignedTransaction(serializedTx);
        logger.info(`Successfully transferred RTC: ${receipt.transactionHash}`);
      } else {
        await mintTokens(payload);
      }
      await Swap.findOneAndUpdate(
        { _id: payload.txHash },
        {
          $set: {
            mintStatus: DB_CONSTANTS.MINT_STATUS.MINTED,
          },
        }
      );
      await syncDb();
      if (payload.fromToken !== 'RTO' && payload.fromToken !== 'RTC') {
        await burnTokens(payload);
      }
      await Swap.findOneAndUpdate(
        { _id: payload.txHash },
        {
          $set: {
            status: DB_CONSTANTS.TXN_STATUS.PROCESSED,
            burnStatus: DB_CONSTANTS.BURN_STATUS.BURNED,
          },
        }
      );
      await updateSwapStatus(payload.swapId, 'CLOSED');
      logger.info(`Swap with ID ${payload.swapId} Completed Successfully!`);
      //To send notification to backend
      await sendNotification(payload.txHash);
    } catch (e) {
      logger.error(`Swap ID : ${payload.swapId}: Failed: ${e} `);
      await Swap.findOneAndUpdate(
        { _id: payload.txHash },
        { $set: { status: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED } },
        { $inc: { tries: 1 } }
      );
      await updateSwapStatus(payload.swapId, 'FAILED');
      await syncDb();
    }
  }
  return;
};

const mintTokens = async (payload) => {
  const txn = await Swap.findOne({ _id: payload.txHash });
  const keys = Object.keys(txn);
  if ((keys.length && txn.mintStatus === DB_CONSTANTS.MINT_STATUS.NOT_MINTED) || !keys.length) {
    try {
      const { toToken: coinCode, fromAddress: receiver, toAmount: amount } = payload;
      const admin = contracts.TOKENS[coinCode].admin;
      const myContract = await getContractInstance(coinCode);
      const decimals = 18;
      const to = contracts.TOKENS[coinCode].address;
      const amountInHex = txnServices.getBigNumberObject(amount, decimals);
      const gasLimit = await myContract.methods.mint(receiver, amountInHex).estimateGas({
        from: admin,
      });
      const data = await myContract.methods.mint(receiver, amountInHex).encodeABI({ from: admin });
      const serializedTx = await txnServices.signTxnWithKMS(admin, to, gasLimit, data, coinCode);
      const receipt = await web3.eth.sendSignedTransaction(serializedTx);

      logger.info(`Successfully minted ${coinCode}: ${receipt.transactionHash}`);
      return;
    } catch (e) {
      logger.error(`Minting  failed : ${e} `);
      throw new Error();
    }
  }
};

const burnTokens = async (payload) => {
  const txn = await Swap.findOne({ _id: payload.txHash });
  const keys = Object.keys(txn);
  if ((keys.length && txn.burnStatus === DB_CONSTANTS.BURN_STATUS.NOT_BURNED) || !keys.length) {
    try {
      const { fromToken: coinCode, fromAmount: amount } = payload;
      const admin = contracts.TOKENS[coinCode].admin;
      const myContract = await getContractInstance(coinCode);
      const decimals = 18;
      const to = contracts.TOKENS[coinCode].address;
      const amountInHex = txnServices.getBigNumberObject(amount, decimals);
      const gasLimit = await myContract.methods.burn(admin, amountInHex).estimateGas({
        from: admin,
      });
      const data = await myContract.methods.burn(admin, amountInHex).encodeABI({ from: admin });
      const serializedTx = await txnServices.signTxnWithKMS(admin, to, gasLimit, data, coinCode);
      const receipt = await web3.eth.sendSignedTransaction(serializedTx);
      logger.info(`Successfully burned ${coinCode}: ${receipt.transactionHash}`);
      return;
    } catch (e) {
      logger.error(`Burning failed : ${e} `);
      throw new Error();
    }
  }
};

const updateSwapStatus = async (swapId, status) => {
  try {
    const swapState = Object.freeze({
      INVALID: 0,
      OPEN: 1,
      CLOSED: 2,
      EXPIRED: 3,
      FAILED: 4,
    });
    const from = config.ADMIN_ADDRESS;
    const myContract = await getContractInstance(SWAP);
    const to = contracts.SWAP.address;
    const gasLimit = await myContract.methods
      .updateSwapStatus(swapId, swapState[status])
      .estimateGas({
        from,
      });
    const data = await myContract.methods
      .updateSwapStatus(swapId, swapState[status])
      .encodeABI({ from });
    const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    logger.info(`Swap Status Updated: ${receipt.transactionHash}`);
    return;
  } catch (e) {
    logger.error(`Swap Status Update Failed! : ${e} `);
    throw new Error();
  }
};

const checkBalance = async (from, token, amount) => {
  const myContract = await getContractInstance(token);
  const decimals = await getDecimals(token);
  const reqAmount = txnServices.getBigNumberObject(amount, decimals);
  const balance = await myContract.methods.balanceOf(from).call();
  if (BigNumber(reqAmount).gt(BigNumber(balance))) {
    throw new Error(`INSUFFICIENT_${token}_BALANCE`);
  }
  return;
};

//!To Remove
const mint = async (receiver, token, amount) => {
  const myContract = await getContractInstance(token);
  const decimals = 18;
  const from = contracts.TOKENS[token].admin;
  const to = contracts.TOKENS[token].address;
  const amountInHex = txnServices.getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods.mint(receiver, amountInHex).estimateGas({
    from,
  });
  const data = await myContract.methods.mint(receiver, amountInHex).encodeABI({ from });

  const serializedTx = await txnServices.signTxnWithKMS(from, to, gasLimit, data, token);
  return serializedTx;
};

module.exports = {
  getUnitPrice,
  getSwapSummary,
  getTokenAdminAddress,
  setTokenAdminAddress,
  getTokenContractAddress,
  setTokenContractAddress,
  getOracleContractAddress,
  setOracleContractAddress,
  getOracleLinkTokenAddress,
  getOracleOwnerAddress,
  getOracleConsumerAddress,
  setOracleConsumerAddress,
  setOracleNodePermission,
  getSwapFee,
  updateSwapAdminFee,
  approveSwapTxn,
  swap,
  details,
  pushToQueue,
  insertSwapRequestToDB,
  swapOrganizer,
  //!To Remove
  mint,
  
};
