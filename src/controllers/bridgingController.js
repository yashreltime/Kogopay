import express from 'express';
const router = express.Router();

import { validate } from 'express-validation';
import validatorSchema from '../validators/bridgingAPIvalidators';
import httpResponse from '../models/httpResponseModel';
import bridgingService from '../services/bridgingServices';
import { processPendingRequests } from '../services/bridgingCheckUpServices';
import { generateBitcoinAddress } from '../services/btcServices';

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /bridge/mint:
 *   post:
 *     tags: [Bridging Management]
 *     summary: For bridging tokens or coins to reltime and minting
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Mint
 *               code:
 *                 type: string
 *                 description: Original Coin Code
 *               chain:
 *                 type: string
 *                 description: Bridging chain
 *               toAddress:
 *                 type: string
 *                 description: Address received coin or token on bridging chain (ADMIN)
 *               fromAddress:
 *                 type: string
 *                 description: Address sent coin or token on bridging chain (ADMIN). This address will receive wrapped token
 *               value:
 *                 type: string
 *                 description: Amount of tokens
 *               txHash:
 *                 type: string
 *                 description: Txn hash from Bridging chain
 *               paymentType:
 *                 type: string
 *                 description: Only for bitcoin
 *               blockHeight:
 *                 type: string
 *                 description: Only for bitcoin
 *               blockHash:
 *                 type: string
 *                 description: Only for bitcoin
 *     responses:
 *       200:
 *         description: Returns success true.
 */
const mint = async (req, res, next) => {
  try {
    await bridgingService.pushToQueue(req.body);
    res.send(new httpResponse(true, {}, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /bridge/burn:
 *   post:
 *     tags: [Bridging Management]
 *     summary: For bridging tokens or coins from reltime and burning
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Burn
 *               code:
 *                 type: string
 *                 description: Original Coin Code
 *               chain:
 *                 type: string
 *                 description: Bridging chain
 *               toAddress:
 *                 type: string
 *                 description: ADMIN
 *               fromAddress:
 *                 type: string
 *                 description: This address will receive token or coin on respective chain
 *               value:
 *                 type: string
 *                 description: Amount of tokens
 *               txHash:
 *                 type: string
 *                 description: Txn hash from Bridging chain
 *     responses:
 *       200:
 *         description: Returns success true.
 */
const burn = async (req, res, next) => {
  try {
    await bridgingService.pushToQueue(req.body);
    res.send(new httpResponse(true, {}, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /bridge/mint-check-up:
 *   post:
 *     tags: [Bridging Management]
 *     summary: For processing pending mint requests
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mint Checkup completed.
 */
const mintCheckUp = async (req, res, next) => {
  try {
    await processPendingRequests('mint');
    res.send(new httpResponse(true, { message: 'Mint Checkup completed.' }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /bridge/burn-check-up:
 *   post:
 *     tags: [Bridging Management]
 *     summary: For processing pending burn requests
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Burn Checkup completed.
 */
const burnCheckUp = async (req, res, next) => {
  try {
    await processPendingRequests('burn');
    res.send(new httpResponse(true, { message: 'Burn Checkup completed.' }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /bridge/btc-admin:
 *   post:
 *     tags: [Bridging Management]
 *     summary: For creating admin account for BTC
 *     responses:
 *       200:
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 address:
 *                   type: string
 *                   description: Generated BTC address
 */
const createBtcAdmin = async (req, res, next) => {
  try {
    const address = await generateBitcoinAddress();
    res.send(new httpResponse(true, { address }, null));
  } catch (error) {
    next(error);
  }
};

router.post('/mint', validate(validatorSchema.mint, { keyByField: true }), mint);
router.post('/burn', validate(validatorSchema.burn, { keyByField: true }), burn);
router.post('/mint-check-up', mintCheckUp);
router.post('/burn-check-up', burnCheckUp);
router.post('/btc-admin', createBtcAdmin);

module.exports = router;
