import { default as Common } from '@ethereumjs/common';
import { Transaction as Tx } from '@ethereumjs/tx';
import BigNumber from 'bignumber.js';

import config from '../config/env';
import getWeb3Instance from './customWeb3';
import contracts from '../constants/contractDetails.js';
import network from '../constants/networks';
import { getContractInstance, getDecimals } from './commonServices';
import { getNonce } from './nonceManagerService';
import { getBigNumberObject, checkBalance } from './transactionServices';
import btcServices from './btcServices';

const getChain = async (coin) => {
  return contracts.TOKENS[coin].chain;
};

const getGasPrice = async (chain) => {
  if (chain === 'RTC') {
    return '0x0';
  }

  const web3 = await getWeb3Instance(chain);
  const currentGasPrice = await web3.eth.getGasPrice();
  const gasPriceBN = BigNumber(currentGasPrice);
  const gasPriceAddOnBn = BigNumber(config.GAS_ADD_ON[chain]);
  return '0x' + gasPriceBN.plus(gasPriceAddOnBn).toString(16);
};

const getGasLimit = async (chain, txObject) => {
  const web3 = await getWeb3Instance(chain);
  try {
    const gasLimit = await web3.eth.estimateGas({
      ...txObject,
    });
    return '0x' + BigNumber(gasLimit).toString(16);
  } catch (error) {
    throw Error(`Insufficient ${chain} balance for gas fee!`);
  }
};

const buildTxnForCoinTransfer = async (coin, from, to, amount) => {
  const chain = await getChain(coin);
  const nonce = await getNonce(coin, from);
  const gasPrice = await getGasPrice(chain);
  const decimals = await getDecimals(coin);
  const value = await getBigNumberObject(amount, decimals);

  let txObject = {
    from,
    to,
    nonce,
    gasPrice,
    value,
  };

  txObject.gasLimit = await getGasLimit(chain, txObject);
  const common = Common.custom(network[chain][config.NETWORK]);
  return Tx.fromTxData(txObject, {
    common,
  });
};

const buildTxnForTokenTransfer = async (coin, from, to, amount) => {
  const chain = await getChain(coin);
  const nonce = await getNonce(coin, from);
  const gasPrice = await getGasPrice(chain);
  const tokenContract = await getContractInstance(coin);
  const decimals = await getDecimals(coin);
  const contractAddress = contracts.TOKENS[coin].address;
  const amountInHex = await getBigNumberObject(amount, decimals);
  const data = await tokenContract.methods.transfer(to, amountInHex).encodeABI({ from });

  let txObject = {
    from,
    to: contractAddress,
    nonce,
    gasPrice,
    value: '0x0',
    data,
  };

  txObject.gasLimit = await getGasLimit(chain, txObject);
  const common = Common.custom(network[chain][config.NETWORK]);
  return Tx.fromTxData(txObject, {
    common,
  });
};

//TODO need to change response
const buildBitcoinTxn = async (from, to, value) => {
  const metadata = await btcServices.getUTXOs(from);
  const balance = metadata.balance;
  if (balance && !metadata.unconfirmed_n_tx) {
    const utxos = metadata.txrefs;
    const inputs = utxos.filter(({ spent, double_spend, confirmations }) => {
      return !spent && !double_spend && confirmations >= 6;
    });
    if (!inputs || !inputs.length) {
      throw Error(
        'Your balance is yet to be confirmed. Please wait till we have 6/6 confirmations'
      );
    }
    const investment = BigNumber(value).times(BigNumber(10).pow(BigNumber(8)));
    const fee = BigNumber(1000); //In satoshis
    const tAmount = investment.minus(fee);
    const rAmount = BigNumber(balance).minus(investment);
    if (!tAmount.gt(BigNumber(0)) || !rAmount.gt(BigNumber(0))) {
      throw Error('The transaction cannot be completed due to insufficient BTC balance in the account to cover the amount and the fee.');
    }
    const outputs = [
      {
        address: to,
        amount: tAmount.toNumber(),
      },
      {
        address: from,
        amount: rAmount.toNumber(),
      },
    ];
    return { balance, inputs, outputs, fee };
  } else {
    throw Error('Waiting for last transaction confirmation');
  }
};

const sendBitcoinTxn = async (hexstring) => {
  const btcClient = await btcServices.getBtcClient();
  return btcClient.sendrawtransaction({ hexstring });
};

const buildTransferTxn = async (coin, from, to, amount) => {
  await checkBalance(from, amount, coin);
  if (['RTC', 'ETH', 'BNB'].includes(coin)) {
    return buildTxnForCoinTransfer(coin, from, to, amount);
  } else if (coin === 'BTC') {
    return buildBitcoinTxn(from, to, amount);
  } else {
    return buildTxnForTokenTransfer(coin, from, to, amount);
  }
};

const checkStatus = async (chain, txnId) => {
  const web3 = await getWeb3Instance(chain);
  const status = await web3.eth.getTransactionReceipt(txnId);
  return status;
};

module.exports = {
  buildTransferTxn,
  buildTxnForCoinTransfer,
  buildTxnForTokenTransfer,
  sendBitcoinTxn,
  checkStatus,
};
