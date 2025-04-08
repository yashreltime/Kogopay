import Nonce from '../models/nonceSchemaModel';
import chainConfig from '../constants/networks';
import { ADMIN_ADDRESS } from '../config/env';
import contracts from '../constants/contractDetails';
import logger from '../middleware/logger';
import getWeb3Instance from './customWeb3';

const syncDb = async () => {
  try {
    logger.info(`Syncing nonces.`);
    let outerPromises = [];
    let updatePromises = [];
    // const addresses = Object.values(contracts.TOKENS).filter(
    //   (token) => contracts.TOKENS[token].admin
    // );
    const addresses = Object.values(contracts.TOKENS).filter(
      (token) => token && token.admin
    );
    addresses.push(ADMIN_ADDRESS);
    const filteredAddresses = addresses.filter(
      (address, index) => address.length === 42 && addresses.indexOf(address) === index
    );
    const chains = Object.keys(chainConfig);
    filteredAddresses.forEach(async (address) => {
      let promises = [];
      chains.map(async (chain) => {
        if (chain !== 'BTC') {
          promises.push(getTransactionCount(chain, address));
        }
      });
      outerPromises.push(Promise.all(promises));
    });
    const nonces = await Promise.all(outerPromises);
    filteredAddresses.forEach(async (address, i) => {
      let data = {};
      data[address] = {};
      chains.map(async (chain, j) => {
        if (chain !== 'BTC') {
          data[address][chain] = nonces[i][j];
        }
      });
      updatePromises.push(updateOnDb(address, data[address]));
    });
    await Promise.all(updatePromises);
    logger.info(`Updated nonces.`);
  } catch (e) {
    logger.error(`Nonce syncing failed : ${e}`);
  }
};

const getTransactionCount = async (chain, address) => {
  const web3 = await getWeb3Instance(chain);
  return await web3.eth.getTransactionCount(address);
};

const getNonce = async (code, address) => {
  let chain = 'RTC';
  if (Object.keys(contracts.TOKENS).includes(code)) {
    chain = contracts.TOKENS[code].chain;
  }
  // const adminAddresses = Object.values(contracts.TOKENS).filter(
  //   (token) => contracts.TOKENS[token].admin
  //   (token) => token && token.admin
  // );
  let adminAddresses = [];
  if (code !== 'ADMIN') {
      adminAddresses = Object.values(contracts.TOKENS).filter(
             (token) => contracts.TOKENS[code].admin
      );
  }
  adminAddresses.push(ADMIN_ADDRESS);
  if (!adminAddresses.includes(address)) {
    const web3 = await getWeb3Instance(chain);
    return await web3.eth.getTransactionCount(address);
  } else {
    const nonce = await getLatestNonce(chain, address);
    return nonce;
  }
};

//TODO: On mint check up and burn check up nonce issue still exists.
const getLatestNonce = async (chain, address) => {
  const web3 = await getWeb3Instance(chain);
  const nonceAtChain = await web3.eth.getTransactionCount(address);
  const nonceAtDb = (await Nonce.findOne({ _id: address }, [chain]))[chain];
  const nonce = nonceAtChain > nonceAtDb ? nonceAtChain : nonceAtDb;
  const updatedNonce = {};
  updatedNonce[chain] = nonce + 1;
  await updateOnDb(address, updatedNonce);
  return nonce;
};

const updateOnDb = async (address, data) => {
  return await Nonce.findOneAndUpdate(
    { _id: address },
    { $set: data },
    { upsert: true, writeConcern: { w: 1 } }
  );
};

module.exports = { syncDb, getNonce };
