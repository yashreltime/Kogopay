import { RPCClient } from 'rpc-bitcoin';
import * as bitcoinLib from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import axios from 'axios';

import env from '../config/env';
import networkConfig from '../constants/networks';
import logger from '../middleware/logger';
import BTCAccount from '../models/btcAccount';

//Common variables
const networkName = networkConfig.BTC[env.NETWORK].name;
const ECPair = ECPairFactory(ecc);
const network = bitcoinLib.networks[networkName];
let client;

const generateBitcoinAddress = async () => {
  const addresses = await BTCAccount.findOne({ _id: 1 });
  if (!addresses) {
    const { keyPair, address } = generateKeyPair();
    const btcClient = await getBtcClient();
    const wallet_name = 'admin_staging.dat';
    await btcClient.createwallet({
      wallet_name,
      disable_private_keys: true,
      blank: true,
    });
    await btcClient.importaddress({ address, label: 'Admin_Staging', rescan: false }, wallet_name);
    logger.info(`Admin address imported : ${address}`);
    await BTCAccount.create({ _id: 1, address, private: keyPair.toWIF() });
    logger.info('Added bitcoin admin account details to DB');
    return address;
  }
  logger.info(`Bitcoin admin exists on DB: ${addresses.address}`);
  return addresses.address;
};

/**
 * To generate keypair for Bitcoin transfer according to specific network
 */
const generateKeyPair = () => {
  const keyPair = ECPair.makeRandom({ network });
  if (!keyPair) {
    throw Error('Some issues on generating keypair');
  }
  const { address } = bitcoinLib.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network,
  });
  return { keyPair, address };
};

/**
 * To get key details from private key in wallet import form
 * @param  {} privkeyWif private key in wallet import form
 */
const getKeyPairFromWIF = (privkeyWif) => {
  return ECPair.fromWIF(privkeyWif, network);
};

/**
 * To get a Blockchain connected RPC Client
 */
const getBtcClient = () => {
  if (!client) {
    client = new RPCClient({
      url: env.RPC_URL.BTC.URL,
      port: '18332',
      user: env.RPC_URL.BTC.USERNAME,
      pass: env.RPC_URL.BTC.PASSWORD,
    });
  }
  return client;
};

/**
 * To get Transaction details using public API
 * @param  {} txid Transaction ID
 */
const getBlockHash = async (txid) => {
  try {
    const url = env.BLOCK_CYPHER.HTTP_URL;
    const result = await axios.get(url + `/txs/${txid}?includeHex=true`);
    return result.data;
  } catch (err) {
    logger.error(err);
    throw new Error('Error getting block hash.');
  }
};

/**
 * Used to verify input signatures on transaction object
 * @param  {} pubkey
 * @param  {} msghash
 * @param  {} signature
 */
const validator = (pubkey, msghash, signature) =>
  ECPair.fromPublicKey(pubkey).verify(msghash, signature);

/**
 * To get account balance using public API
 * @param  {} account Address
 */
const getBTCBalance = async (account) => {
  try {
    const url = env.BLOCK_CYPHER.HTTP_URL;
    const result = await axios.get(url + `/addrs/${account}/balance`);
    return result.data.balance;
  } catch (err) {
    logger.error(err);
    throw new Error('Error getting Bitcoin balance.');
  }
};

/**
 * To get unspent transactions of account
 * @param  {} account Address
 */
const getUTXOs = async (account) => {
  try {
    const url = env.BLOCK_CYPHER.HTTP_URL;
    const result = await axios.get(url + `/addrs/${account}?unspentOnly=true&includeScript=true`);
    return result.data;
  } catch (err) {
    logger.error(err);
    throw new Error('Error getting unspent transactions.');
  }
};

//So chain
// const sent = async (tx_hex) => {
//   const body = { tx_hex };
//   const url = env.BLOCK_CYPHER.HTTP_URL;
//   try {
//     const result = await axios.post(
//       'https://chain.so/api/v2/send_tx/BTCTEST',
//       JSON.stringify(body)
//     );
//     return result;
//   } catch (err) {
//     return err;
//   }
// };

//Blockcypher
// const sent = async (tx) => {
//   const body = { tx };
//   const url = env.BLOCK_CYPHER.HTTP_URL;
//   try {
//     const result = await axios.post(url + '/txs/push', JSON.stringify(body));
//     return result;
//   } catch (err) {
//     return err;
//   }
// };

module.exports = {
  generateBitcoinAddress,
  generateKeyPair,
  getKeyPairFromWIF,
  getBtcClient,
  getBlockHash,
  getBTCBalance,
  getUTXOs,
  validator,
  // sent,
};
