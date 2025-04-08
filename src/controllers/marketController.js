import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import web3 from '../services/web3';
import validatorSchema from '../validators/marketAPIValidators';
import httpResponse from '../models/httpResponseModel';
import marketService from '../services/marketServices';
import contractService from '../services/contractServices';
import { getDecimals } from '../services/commonServices';
import { formatter } from '../services/dataFormatter';

/**
 * @swagger
 * /market/earnings:
 *   get:
 *     tags: [Market Operations]
 *     summary: To calculate earning details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Lending amount
 *               interest:
 *                 type: number
 *                 description: Interest rate
 *               duration:
 *                 type: integer
 *                 description: Tenure in months
 *     responses:
 *       200:
 *         description: Returns earning details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intrest:
 *                   type: string
 *                 totalAmount:
 *                   type: string
 *                 totalAdminShare:
 *                   type: string
 *                 monthlyAdminShare:
 *                   type: string
 *                 totalUserShare:
 *                   type: string
 *                 monthlyUserShare:
 *                   type: string
 *                 monthlyTotalShare:
 *                   type: string
 *                 completedInstallments:
 *                   type: string
 */
const earningsSummary = async (req, res, next) => {
  try {
    const { amount, interest, duration } = req.body;
    const decimals = await getDecimals('PROPOSAL');
    const earnings = await marketService.calculateEarnings(amount, interest, duration, decimals);
    const resp = await formatter('earningDetails', earnings, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /market/set:
 *   post:
 *     tags: [Market Operations]
 *     summary: To set contract addresses in contracts. (For initial setup)
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
 *               contract:
 *                 type: string
 *                 description: REGISTRY or PAYMENT
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
const setContracts = async (req, res, next) => {
  try {
    const { from, contract } = req.body;
    const serializedTx = await contractService.setContractAddress(from, contract);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /market/roles:
 *   post:
 *     tags: [Market Operations]
 *     summary: To give role for VAULT contract in ESCROw (For initial setup)
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
 *               code:
 *                 type: string
 *                 description: Escrow contract code
 *               depositer:
 *                 type: string
 *                 description: Depositer contract address
 *               withdrawer:
 *                 type: string
 *                 description: Withdrawer contract address
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
const setEscrowContractRoles = async (req, res, next) => {
  try {
    const { from, code, depositer, withdrawer } = req.body;
    const serializedTx = await contractService.setRolesInEscrow(from, code, depositer, withdrawer);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /market/collateral-details:
 *   get:
 *     tags: [Market Operations]
 *     summary: Get current collateral parameters used for lending and borrowing
 *     responses:
 *       200:
 *         description: Returns collateral parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 adminShare:
 *                   type: string
 *                 collateralPercent:
 *                   type: string
 *                 collateralInterestMultipleFactor:
 *                   type: string
 *                 delayedInstalmentsCount:
 *                   type: string
 *                   description: After these much delayed instalments loan will be closed by deducting pending amount from collateral
 */
const marketContractParams = async (req, res, next) => {
  try {
    const params = await marketService.getContractParameters();
    const decimals = await getDecimals('REGISTRY');
    const resp = await formatter('marketContract', params, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /market/collateral-percentage:
 *   patch:
 *     tags: [Market Operations]
 *     summary: To update collateral percentage rate
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
 *               percentage:
 *                 type: number
 *                 description: This much percentage of lending amount is used to calculate total collateral amount
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
const collateralPercentage = async (req, res, next) => {
  try {
    const { from, percentage } = req.body;
    const serializedTx = await marketService.updateCollateralPercentage(from, percentage);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /market/collateral-interest-factor:
 *   patch:
 *     tags: [Market Operations]
 *     summary: To update collateral interest factor
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
 *               factor:
 *                 type: number
 *                 description: This much times of interest rate is used to calculate total collateral amount
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
const collateralIntrestFactor = async (req, res, next) => {
  try {
    const { from, factor } = req.body;
    const serializedTx = await marketService.updateCollateralIntrestFactor(from, factor);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /market/max-delay-count:
 *   patch:
 *     tags: [Market Operations]
 *     summary: To update maximum delayed instalments
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
 *               count:
 *                 type: number
 *                 description: Maximum allowed delayed instalment count
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
const delayedInstalmentCount = async (req, res, next) => {
  try {
    const { from, count } = req.body;
    const serializedTx = await marketService.updateDelayedInstalmentLimit(from, count);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

const withdrawEscrowFund = async (req, res, next) => {
  try {
    const { from, receiver } = req.body;
    const serializedTx = await contractService.withdrawEscrowFund(from, receiver);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

router.get('/earnings', validate(validatorSchema.earnings, { keyByField: true }), earningsSummary);

router.post('/set', validate(validatorSchema.set, { keyByField: true }), setContracts);

router.post(
  '/roles',
  validate(validatorSchema.roles, { keyByField: true }),
  setEscrowContractRoles
);

router.get('/collateral-details', marketContractParams);

router.patch(
  '/collateral-percentage',
  validate(validatorSchema.collateralPercentage, { keyByField: true }),
  collateralPercentage
);

router.patch(
  '/collateral-interest-factor',
  validate(validatorSchema.collateralIntrestFactor, { keyByField: true }),
  collateralIntrestFactor
);

router.patch(
  '/max-delay-count',
  validate(validatorSchema.delayCount, { keyByField: true }),
  delayedInstalmentCount
);

router.post(
  '/withdraw-escrow-fund',
  validate(validatorSchema.withdrawEscrowFund, { keyByField: true }),
  withdrawEscrowFund
);

module.exports = router;
