import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import web3 from '../services/web3';
import validatorSchema from '../validators/commonAPIValidators';
import httpResponse from '../models/httpResponseModel';
import commonService from '../services/commonServices';
import contractService from '../services/contractServices';
import config from '../config/env';

/**
 * @swagger
 * /common/owner/{contract}:
 *   get:
 *     tags: [Common Operations]
 *     summary: For getting owner of a contract
 *     parameters:
 *     - in: path
 *       name: contract
 *       schema:
 *         type: string
 *       required: true
 *       description: Contract code
 *     responses:
 *       200:
 *         description: Returns owner address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 owner:
 *                   type: string
 */
const owner = async (req, res, next) => {
  try {
    const { contract } = req.params;
    const owner = await commonService.getOwner(contract);

    res.send(new httpResponse(true, { owner }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /common/admin-share/{contract}:
 *   get:
 *     tags: [Common Operations]
 *     summary: For getting admin share for operations in various contract(transfer and lending)
 *     parameters:
 *     - in: path
 *       name: contract
 *       schema:
 *         type: string
 *       required: true
 *       description: Contract code
 *     responses:
 *       200:
 *         description: Returns admin share
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adminShare:
 *                   type: string
 */
const adminShare = async (req, res, next) => {
  try {
    const { contract } = req.params;
    const adminShare = await commonService.getAdminShare(contract);

    res.send(new httpResponse(true, { adminShare }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /common/admin-share:
 *   patch:
 *     tags: [Common Operations]
 *     summary: To update admin share
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin address
 *               share:
 *                 type: number
 *                 description: New admin share
 *               contract:
 *                 type: string
 *                 description: Contract code
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
 *       401:
 *         description: ADMIN_ONLY
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Restricted to admin only.
 */
const updateAdminShare = async (req, res, next) => {
  try {
    const { from, share, contract } = req.body;
    const serializedTx = await contractService.updateAdminShare(from, share, contract);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /common/balance:
 *   get:
 *     tags: [Common Operations]
 *     summary: To get balance of address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: USer Address
 *               coinCode:
 *                 type: string
 *                 description: Token or coin code
 *     responses:
 *       200:
 *         description: Returns balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: string
 */
const balance = async (req, res, next) => {
  try {
    const { from, coinCode } = req.body;
    const balance = await commonService.getBalance(from, coinCode);
    res.send(new httpResponse(true, { balance }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /common/balance:
 *   get:
 *     tags: [Common Operations]
 *     summary: To get balance of address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: USer Address
 *               coinCode:
 *                 type: string
 *                 description: Token or coin code
 *     responses:
 *       200:
 *         description: Returns balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: string
 */
const batchBalance = async (req, res, next) => {
  try {
    const { addresses, coinCode } = req.body;
    const result = await commonService.getBalanceOfBatch(addresses, coinCode);
    res.send(new httpResponse(true, result, null));
  } catch (e) {
    next(e);
  }
};
//To get the RTC price
const fetchRTCPrice = async (req, res, next) => {
  try {
    
    const price = config.RTC_CONSTANT_PRICE;
    res.send(new httpResponse(true, { price }, null));
  } catch (e) {
    next(e);
  }
};


router.get('/owner/:contract', validate(validatorSchema.owner, { keyByField: true }), owner);

router.get(
  '/admin-share/:contract',
  validate(validatorSchema.adminShare, { keyByField: true }),
  adminShare
);

router.patch(
  '/admin-share',
  validate(validatorSchema.updateAdminShare, { keyByField: true }),
  updateAdminShare
);

router.get('/balance', validate(validatorSchema.balance, { keyByField: true }), balance);

router.get(
  '/batch_balance',
  validate(validatorSchema.batchBalance, { keyByField: true }),
  batchBalance
);

router.get(
  '/fetch_rtcprice',
 fetchRTCPrice
);

module.exports = router;
