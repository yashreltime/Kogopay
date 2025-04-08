require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
const RPC_URL = process.env.RPC_URL;

module.exports = {
  networks: {
    development: {
      provider: new HDWalletProvider([DEPLOYER_KEY], RPC_URL),
      network_id: '*',
    },
    reltime_testnet: {
      provider: new HDWalletProvider([DEPLOYER_KEY], RPC_URL),
      network_id: '24242',
    },
    reltime_mainnet: {
      provider: new HDWalletProvider([DEPLOYER_KEY], RPC_URL),
      network_id: '32323',
    },
  },

  mocha: {
    timeout: 100000
  },

  compilers: {
    solc: {
      version: '0.8.12', // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
};
