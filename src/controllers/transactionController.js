import express from 'express';
const router = express.Router();

import web3 from '../services/web3';
import getWeb3Instance from '../services/customWeb3';
import config from '../config/env';
import { validate } from 'express-validation';
import validatorSchema from '../validators/transferAPIvalidators';
import httpResponse from '../models/httpResponseModel';
import txnService from '../services/transactionServices';
import { buildTransferTxn, sendBitcoinTxn, checkStatus } from '../services/transferService';

/**
 * @swagger
 * /transaction/:
 *   get:
 *     tags: [Transaction Management]
 *     summary: To get transaction details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               txnHash:
 *                 type: string
 *                 description: Transaction Hash
 *     responses:
 *       200:
 *         description: Returns transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blockHash:
 *                   type: string
 *                 blockNumber:
 *                   type: integer
 *                 from:
 *                   type: string
 *                 gas:
 *                   type: integer
 *                 gasPrice:
 *                   type: string
 *                 hash:
 *                   type: string
 *                 input:
 *                   type: string
 *                 nonce:
 *                   type: integer
 *                 publicKey:
 *                   type: string
 *                 raw:
 *                   type: string
 *                 to:
 *                   type: string
 *                 transactionIndex:
 *                   type: integer
 *                 value:
 *                   type: string
 *                 v:
 *                   type: string
 *                 r:
 *                   type: string
 *                 s:
 *                   type: string
 */
const getTxnStatus = async (req, res, next) => {
  try {
    const { chain, txnHash } = req.body;
    const status = await checkStatus(chain, txnHash);
    res.send(new httpResponse(true, status, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /transaction/:
 *   post:
 *     tags: [Transaction Management]
 *     summary: For Peer to Peer (P2P) transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender:
 *                 type: string
 *                 description: Sender Address
 *               receiver:
 *                 type: string
 *                 description: Receiver Address
 *               amount:
 *                 type: string
 *                 description: Amount of tokens or coins
 *               coinCode:
 *                 type: string
 *                 description: Token or Coin symbol (RTO,RTC)
 *     responses:
 *       200:
 *         description: Returns transaction build.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnBuild:
 *                   type: object
 *                   properties:
 *                     nonce:
 *                       type: string
 *                     gasPrice:
 *                       type: string
 *                     gasLimit:
 *                       type: string
 *                     to:
 *                       type: string
 *                     value:
 *                       type: string
 *                     data:
 *                       type: string
 *       520:
 *         description: INSUFFICIENT_RTO_BALANCE/INSUFFICIENT_RTC_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient RTC/RTO Balance. Please recharge the account before trying again.
 */
const createTxn = async (req, res, next) => {
  try {
    const { sender, receiver, amount, coinCode } = req.body;
    const txnBuild = await buildTransferTxn(coinCode, sender, receiver, amount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /transaction/buy:
 *   post:
 *     tags: [Transaction Management]
 *     summary: For buying tokens or coins
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver:
 *                 type: string
 *                 description: Receiver Address
 *               amount:
 *                 type: string
 *                 description: Amount of tokens or coins
 *               coinCode:
 *                 type: string
 *                 description: Token or Coin symbol (RTO,RTC)
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
 *       520:
 *         description: INSUFFICIENT_RTO_BALANCE/INSUFFICIENT_RTC_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient RTO/RTC Balance. Please recharge the account before trying again.
 */
const buy = async (req, res, next) => {
  try {
    const { receiver, amount, coinCode } = req.body;
    let serializedTx;
    if (coinCode === 'RTC') {
      serializedTx = await txnService.buyRTC(receiver, amount, coinCode);
    } else if (config.CURRENCY_LIST.includes(coinCode) && coinCode !== 'RTC') { //To includes all other currencies by excluding RTC
      serializedTx = await txnService.buyRTO(receiver, amount, coinCode);
    }
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /transaction/send:
 *   post:
 *     tags: [Transaction Management]
 *     summary: For sending signed raw transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedTxn:
 *                 type: string
 *                 description: Raw transaction signed by sender.
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
 *       460:
 *         description: INVALID_NONCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Trying to resend a confirmed transaction. Please build a new transaction and resend.
 */
const sendTxn = async (req, res, next) => {
  try {
    let receipt;
    let { signedTxn, chain } = req.body;
    if (!chain) {
      chain = 'RTC';
    }

    if (chain === 'BTC') {
      receipt = await sendBitcoinTxn(signedTxn);
      res.send(new httpResponse(true, { txnHash: receipt }, null));
    } else {
      const customWeb3 = await getWeb3Instance(chain);
      receipt = await customWeb3.eth.sendSignedTransaction(signedTxn);
      res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
    }
  } catch (e) {
    if (e.message.includes('Nonce too low')) {
      e.message = 'INVALID_NONCE';
    }
    next(e);
  }
};

// const sendBTCtxn = async (req, res, next) => {
//   try {
//     const { hexString } = req.body;
//     const receipt = await sendBitcoinTxn(hexString);
//     res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
//   } catch (e) {
//     next(e);
//   }
// };

/**
 * @swagger
 * /transaction/approval:
 *   post:
 *     tags: [Transaction Management]
 *     summary: To get approval from user for transfering fund from their account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Owner Address
 *               sender:
 *                 type: string
 *                 description: Spender Address
 *               amount:
 *                 type: string
 *                 description: Amount of tokens or coins
 *               coinCode:
 *                 type: string
 *                 description: Token or Coin symbol (RTO,RTC)
 *               action:
 *                 type: string
 *                 description: ADD, INC (Increment) or DEC (Decrement)
 *     responses:
 *       200:
 *         description: Returns transaction build.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnBuild:
 *                   type: object
 *                   properties:
 *                     nonce:
 *                       type: string
 *                     gasPrice:
 *                       type: string
 *                     gasLimit:
 *                       type: string
 *                     to:
 *                       type: string
 *                     value:
 *                       type: string
 *                     data:
 *                       type: string
 *       520:
 *         description: INSUFFICIENT_RTO_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient RTO Balance. Please recharge the account before trying again.
 */
const approval = async (req, res, next) => {
  try {
    const { from, spender, amount, coinCode, action } = req.body;
    const txnBuild = await txnService.approveTransaction(from, spender, amount, coinCode, action);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /transaction/allowance:
 *   post:
 *     tags: [Transaction Management]
 *     summary: To check the allowance of specific token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               owner:
 *                 type: string
 *                 description: Owner Address
 *               spender:
 *                 type: string
 *                 description: Spender Address
 *               coinCode:
 *                 type: string
 *                 description: Token or Coin symbol (RTO,RTC)
 *     responses:
 *       200:
 *         description: Returns allowance of spender from token owner.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allowance:
 *                   type: string
 */
const allowance = async (req, res, next) => {
  try {
    const { owner, spender, coinCode } = req.body;
    const allowance = await txnService.getAllowance(owner, spender, coinCode);
    res.send(new httpResponse(true, { allowance }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /transaction/buy:
 *   post:
 *     tags: [Transaction Management]
 *     summary: For buying tokens or coins
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver:
 *                 type: string
 *                 description: Receiver Address
 *               amount:
 *                 type: string
 *                 description: Amount of tokens or coins
 *               coinCode:
 *                 type: string
 *                 description: Token or Coin symbol (RTO,RTC)
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
 *       520:
 *         description: INSUFFICIENT_RTO_BALANCE/INSUFFICIENT_RTC_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient RTO/RTC Balance. Please recharge the account before trying again.
 */
const refill = async (req, res, next) => {
  try {
    const { amount, coinCode } = req.body;
    const serializedTx = await txnService.refill(amount, coinCode);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//! To remove

const mock = async (req, res, next) => {
  try {
    const { coinCode } = req.body;
    const address = await txnService.mock(coinCode);
    res.send(new httpResponse(true, { address }, null));
  } catch (e) {
    next(e);
  }
};

const signer = async (req, res, next) => {
  try {
    const { chain, signer, txnBuild } = req.body;
    const receipt = await txnService.signTxnTest(chain, signer, txnBuild);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

router.post('/signer', signer);

//! Till this

router.post('/', validate(validatorSchema.createTxn, { keyByField: true }), createTxn);

router.post('/status', validate(validatorSchema.getTxnStatus, { keyByField: true }), getTxnStatus);

router.post('/buy', validate(validatorSchema.buy, { keyByField: true }), buy);

router.post('/send', validate(validatorSchema.sendTxn, { keyByField: true }), sendTxn);

// router.post(
//   '/send-btc',
//   validate(validatorSchema.sendBitcoinTxn, { keyByField: true }),
//   sendBTCtxn
// );

router.post('/approval', validate(validatorSchema.approval, { keyByField: true }), approval);

router.post('/allowance', validate(validatorSchema.allowance, { keyByField: true }), allowance);

router.post('/refill', validate(validatorSchema.refill, { keyByField: true }), refill);

router.post('/mock', mock);

module.exports = router;
