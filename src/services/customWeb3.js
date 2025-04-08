import Web3 from 'web3';

import config from '../config/env.js';

const getWeb3Instance = (chain) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(config.RPC_URL[chain]));
  web3.eth.handleRevert = true;
  return web3;
};

module.exports = getWeb3Instance;
