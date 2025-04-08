import express from 'express';
const router = express.Router();

import web3 from '../services/web3';
import { validate } from 'express-validation';
import validatorSchema from '../validators/swappingAPIvalidators';
import httpResponse from '../models/httpResponseModel';
import swappingService from '../services/swappingServices';
import { formatter } from '../services/dataFormatter';

/**
 * @swagger
 * /swap/price:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting market unit price of tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
 *     responses:
 *       200:
 *         description: Returns current market price of token per unit.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token code.
 *                 unitPrice:
 *                   type: string
 *                   description: Latest market rate.
 */
const unitPrice = async (req, res, next) => {
  try {
    const { token } = req.body;
    const unitPrice = await swappingService.getUnitPrice(token);
    res.send(new httpResponse(true, { token, unitPrice }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/summary:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For calculating token amounts according to latest market price.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromToken:
 *                 type: string
 *                 description: Token that to be swapped
 *               fromAmount:
 *                 type: string
 *                 description: Amount of fromToken to be swapped or 0 if toAmount is specified
 *               toToken:
 *                 type: string
 *                 description: Token to which fromToken needed to be swapped
 *               toAmount:
 *                 type: string
 *                 description: Amount of toToken to be received or 0 if fromAmount is specified
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fromToken:
 *                   type: string
 *                   description: Token that to be swapped
 *                 fromAmount:
 *                   type: string
 *                   description: Amount of fromToken to be swapped or 0 if toAmount is specified
 *                 toToken:
 *                   type: string
 *                   description: Token to which fromToken needed to be swapped
 *                 toAmount:
 *                   type: string
 *                   description: Amount of toToken to be received or 0 if fromAmount is specified
 *                 swapFee:
 *                   type: string
 *                   description: Admin Fee debited from to token
 */
const summary = async (req, res, next) => {
  try {
    const { fromToken, fromAmount, toToken, toAmount } = req.body;
    const summary = await swappingService.getSwapSummary(fromToken, toToken, fromAmount, toAmount);
    const resp = await formatter('swapSummary', summary, 18);
    res.send(new httpResponse(true, { fromToken, toToken, ...resp }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/approval:
 *   post:
 *     tags: [Swapping Management]
 *     summary: To get approval from user for transferring fund from their account
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
 *               amount:
 *                 type: string
 *                 description: Amount of tokens or coins
 *               token:
 *                 type: string
 *                 description: Token code
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
 *         description: INSUFFICIENT_{token_code}_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient {token_code} Balance. Please recharge the account before trying again.
 */
const approve = async (req, res, next) => {
  try {
    const { from, token, amount } = req.body;
    const txnBuild = await swappingService.approveSwapTxn(from, token, amount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /swap/init:
 *   post:
 *     tags: [Swapping Management]
 *     summary: For init swap transaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Swap ID
 *               from:
 *                 type: string
 *                 description: From Address
 *               fromToken:
 *                 type: string
 *                 description: Token that to be swapped
 *               fromAmount:
 *                 type: string
 *                 description: Amount of fromToken to be swapped or 0 if toAmount is specified
 *               toToken:
 *                 type: string
 *                 description: Token to which fromToken needed to be swapped
 *               toAmount:
 *                 type: string
 *                 description: Amount of toToken to be received or 0 if fromAmount is specified
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
 */
const initSwap = async (req, res, next) => {
  try {
    const { id, from, fromToken, toToken, fromAmount, toAmount } = req.body;
    const txnBuild = await swappingService.swap(id, from, fromToken, toToken, fromAmount, toAmount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting swap details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Swap ID
 *     responses:
 *       200:
 *         description: Returns swap details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Swap ID
 *               from:
 *                 type: string
 *                 description: From Address
 *               tokenFrom:
 *                 type: string
 *                 description: Token that to be swapped
 *               fromAmount:
 *                 type: string
 *                 description: Amount of tokens swapped
 *               tokenTo:
 *                 type: string
 *                 description: Token to which fromToken needed to be swapped
 *               toAmount:
 *                 type: string
 *                 description: Amount of tokens received
 *               expirationTimestamp:
 *                 type: string
 *                 description: Request expiration time
 *               fromTokenUnitPrice:
 *                 type: string
 *               toTokenUnitPrice:
 *                 type: string
 *               adminFee:
 *                 type: string
 *               swapClaim:
 *                 type: string
 *                 description: Swap current status
 */
const getSwapDetails = async (req, res, next) => {
  try {
    const { id } = req.body;
    const data = await swappingService.details(id);
    const resp = await formatter('swapDetails', data, 18);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /swap/:
 *   post:
 *     tags: [Swapping Management]
 *     summary: For pushing swap request to queue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: swap
 *               chain:
 *                 type: string
 *                 description: Reltime
 *               swapId:
 *                 type: string
 *                 description: Swap ID
 *               fromAddress:
 *                 type: string
 *                 description: Address sent coin or token on bridging chain (ADMIN). This address will receive wrapped token
 *               fromToken:
 *                 type: string
 *                 description: Token that to be swapped
 *               fromAmount:
 *                 type: string
 *                 description: Amount of fromToken to be swapped or 0 if toAmount is specified
 *               toToken:
 *                 type: string
 *                 description: Token to which fromToken needed to be swapped
 *               toAmount:
 *                 type: string
 *                 description: Amount of toToken to be received or 0 if fromAmount is specified
 *               txHash:
 *                 type: string
 *                 description: Hash of from token transaction
 *     responses:
 *       200:
 *         description: Returns success true.
 */
const swap = async (req, res, next) => {
  try {
    await swappingService.pushToQueue(req.body);
    res.send(new httpResponse(true, {}, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/token-admin:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting token admin from swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
 *     responses:
 *       200:
 *         description: Returns Admin Address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token code.
 *                 admin:
 *                   type: string
 *                   description: Admin Address.
 */
const getTokenAdmin = async (req, res, next) => {
  try {
    const { token } = req.body;
    const admin = await swappingService.getTokenAdminAddress(token);
    res.send(new httpResponse(true, { token, admin }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/token-admin:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating token admin on swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
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
 */
const updateTokenAdmin = async (req, res, next) => {
  try {
    const { token } = req.body;
    const serializedTx = await swappingService.setTokenAdminAddress(token);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/token-contract:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting token contract from swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
 *     responses:
 *       200:
 *         description: Returns Token contract Address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token code.
 *                 contractAddress:
 *                   type: string
 *                   description: Token contract Address.
 */
const getTokenContract = async (req, res, next) => {
  try {
    const { token } = req.body;
    const contractAddress = await swappingService.getTokenContractAddress(token);
    res.send(new httpResponse(true, { token, contractAddress }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/token-contract:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating token contract on swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
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
 */
const updateTokenContract = async (req, res, next) => {
  try {
    const { token } = req.body;
    const serializedTx = await swappingService.setTokenContractAddress(token);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/oracle:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting oracle contract from swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token code
 *     responses:
 *       200:
 *         description: Returns Oracle contract Address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token code.
 *                 oracle:
 *                   type: string
 *                   description: Oracle contract Address.
 */
const getOracleContract = async (req, res, next) => {
  try {
    const oracle = await swappingService.getOracleContractAddress();
    res.send(new httpResponse(true, { oracle }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/oracle:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating oracle contract on swapper contract
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oracle:
 *                 type: string
 *                 description: Oracle contract address
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
 */
const updateOracleContract = async (req, res, next) => {
  try {
    const { oracle } = req.body;
    const serializedTx = await swappingService.setOracleContractAddress(oracle);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/oracle-consumer:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting oracle consumer address from oracle contract
 *     responses:
 *       200:
 *         description: Returns Consumer Address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token code.
 *                 consumer:
 *                   type: string
 *                   description: Consumer Address.
 */
const getOracleConsumer = async (req, res, next) => {
  try {
    const consumer = await swappingService.getOracleConsumerAddress();
    res.send(new httpResponse(true, { consumer }, null));
  } catch (e) {
    next(e);
  }
};


const getOracleLinkToken = async (req, res, next) => {
  try {
    const token = await swappingService.getOracleLinkTokenAddress();
    res.send(new httpResponse(true, { token }, null));
  } catch (e) {
    next(e);
  }
};

const getOracleOwner = async (req, res, next) => {
  try {
    const owner = await swappingService.getOracleOwnerAddress();
    res.send(new httpResponse(true, { owner }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/oracle-consumer:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating oracle consumer address on oracle contract
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
 */
const updateOracleConsumer = async (req, res, next) => {
  try {
    const serializedTx = await swappingService.setOracleConsumerAddress();
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/oracle-node:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating chainlink node permission on oracle contract
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
 */
const updateOracleNodeAddress = async (req, res, next) => {
  try {
    const serializedTx = await swappingService.setOracleNodePermission();
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/fee:
 *   get:
 *     tags: [Swapping Management]
 *     summary: For getting admin fee percentage on swapping
 *     responses:
 *       200:
 *         description: Returns Admin Fee percentage.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feeInPercentage:
 *                   type: string
 *                   description: Admin fee deducted from toAmount.
 */
const getSwapFee = async (req, res, next) => {
  try {
    const fee = await swappingService.getSwapFee();
    res.send(new httpResponse(true, { feeInPercentage: fee }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /swap/fee:
 *   patch:
 *     tags: [Swapping Management]
 *     summary: For updating admin fee percentage on swapping
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fee:
 *                 type: string
 *                 description: Admin fee in percentage
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
 */
const updateSwapFee = async (req, res, next) => {
  try {
    const { fee } = req.body;
    const serializedTx = await swappingService.updateSwapAdminFee(fee);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//!To Remove
const mint = async (req, res, next) => {
  try {
    const { receiver, token, amount } = req.body;
    const serializedTx = await swappingService.mint(receiver, token, amount);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};
router.post('/mint', mint);
//!Upto this

router.get('/price', validate(validatorSchema.price, { keyByField: true }), unitPrice);
router.get('/summary', validate(validatorSchema.summary, { keyByField: true }), summary);
router.post('/approval', validate(validatorSchema.approve, { keyByField: true }), approve);
router.post('/init', validate(validatorSchema.init, { keyByField: true }), initSwap);
router.get('/', validate(validatorSchema.swapDetails, { keyByField: true }), getSwapDetails);
router.post('/', validate(validatorSchema.swap, { keyByField: true }), swap);
router.get('/token-admin', validate(validatorSchema.get, { keyByField: true }), getTokenAdmin);
router.patch(
  '/token-admin',
  validate(validatorSchema.setAdmin, { keyByField: true }),
  updateTokenAdmin
);
router.get(
  '/token-contract',
  validate(validatorSchema.get, { keyByField: true }),
  getTokenContract
);
router.patch(
  '/token-contract',
  validate(validatorSchema.setContract, { keyByField: true }),
  updateTokenContract
);
router.get('/oracle', getOracleContract);
router.patch(
  '/oracle',
  validate(validatorSchema.oracle, { keyByField: true }),
  updateOracleContract
);
router.get('/oracle-linktoken', getOracleLinkToken);
router.get('/oracle-owner', getOracleOwner);
router.get('/oracle-consumer', getOracleConsumer);
router.patch('/oracle-consumer', updateOracleConsumer);
router.patch('/oracle-node', updateOracleNodeAddress);
router.get('/fee', getSwapFee);
router.patch('/fee', validate(validatorSchema.fee, { keyByField: true }), updateSwapFee);

module.exports = router;
