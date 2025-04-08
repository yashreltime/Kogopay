import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import validatorSchema from '../validators/borrowAPIValidators';
import httpResponse from '../models/httpResponseModel';
import borrowService from '../services/borrowServices';
import { getDecimals } from '../services/commonServices';
import { formatter } from '../services/dataFormatter';
import boolInterceptor from '../middleware/boolInterceptor';

/**
 * @swagger
 * /borrow/collateral:
 *   get:
 *     tags: [Borrow Operations]
 *     summary: To calculate collateral amount
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
 *     responses:
 *       200:
 *         description: Returns collateral details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collateralPercent:
 *                   type: string
 *                 percentageChange:
 *                   type: string
 *                 interestAmountPercentage:
 *                   type: string
 *                   description: percentageChange * interest
 *                 totalPercentage:
 *                   type: string
 *                   description: collateralPercent + interestAmountPercentage
 *                 totalCollateralAmount:
 *                   type: string
 *                   description: totalPercentage * lending amount / 100
 */
const collateral = async (req, res, next) => {
  try {
    const { amount, interest } = req.body;
    const decimals = await getDecimals('PROPOSAL');
    const data = await borrowService.calculateCollateral(amount, interest, decimals);
    const resp = await formatter('calculateCollateral', data, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /borrow/confirm:
 *   get:
 *     tags: [Borrow Operations]
 *     summary: To confirm or reject loan approval from lender
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Borrower Address
 *               proposalId:
 *                 type: integer
 *                 description: Proposal Unique ID
 *               isCollateral:
 *                 type: boolean
 *                 description: Lender requires collateral for loan or not
 *               accept:
 *                 type: boolean
 *                 description: Accept status
 *               collateralAmount:
 *                 type: number
 *                 collateralAmount: Amount giving as collateral
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
 *       460:
 *         description: INVALID_USER
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid User.
 *       461:
 *         description: INVALID_PROPOSAL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid Proposal.
 */
const confirm = async (req, res, next) => {
  try {
    const { from, proposalId, isCollateral, accept, collateralAmount } = req.body;
    let txnBuild;
    const collateralCode = 'RTO';
    const collateralperUnitPrice = 1;
    if (accept && isCollateral) {
      //with collateral
      txnBuild = await borrowService.acceptRequestWithCollateral(
        from,
        proposalId,
        collateralCode,
        collateralAmount,
        collateralperUnitPrice
      );
    } else if (accept && !isCollateral) {
      //without collateral
      txnBuild = await borrowService.acceptRequest(from, proposalId);
    } else {
      //reject
      txnBuild = await borrowService.rejectRequest(from, proposalId);
    }
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

router.get('/collateral', validate(validatorSchema.collateral, { keyByField: true }), collateral);

router.post(
  '/confirm',
  validate(validatorSchema.confirm, { keyByField: true }),
  boolInterceptor,
  confirm
);

module.exports = router;
