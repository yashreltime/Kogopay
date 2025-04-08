import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';
import BigNumber from 'bignumber.js';

import validatorSchema from '../validators/lendingAPIValidators';
import httpResponse from '../models/httpResponseModel';
import lendingService from '../services/lendingServices';
import { getDecimals } from '../services/commonServices';
import { formatter, arrayFormatter } from '../services/dataFormatter';
import boolInterceptor from '../middleware/boolInterceptor';

/**
 * @swagger
 * /proposal/:
 *   post:
 *     tags: [Lending Operations]
 *     summary: For creating proposal by Lender
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Lender Address
 *               proposalId:
 *                 type: integer
 *                 description: Proposal Unique ID
 *               amount:
 *                 type: integer
 *                 description: Amount of tokens or coins offering
 *               interestRate:
 *                 type: number
 *                 description: Annual interest rate offering
 *               instalmentMonths:
 *                 type: integer
 *                 description: Tenure in months
 *               isDirect:
 *                 type: boolean
 *                 description: Direct P2P lending or not
 *               isCollateral:
 *                 type: boolean
 *                 description: Lender requires collateral for loan or not
 *               isDirectAddress:
 *                 type: string
 *                 description: Borrowers address. Required if isDirect is true
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
 *         description: EXISTING_PROPOSAL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Proposal already exist.
 */
const create = async (req, res, next) => {
  try {
    const txnBuild = await lendingService.createProposal(req.body);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/:
 *   patch:
 *     tags: [Lending Operations]
 *     summary: For updating proposal created by Lender
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Lender Address
 *               proposalId:
 *                 type: integer
 *                 description: Proposal Unique ID
 *               amount:
 *                 type: integer
 *                 description: Amount of tokens or coins offering
 *               interestRate:
 *                 type: number
 *                 description: Annual interest rate offering
 *               instalmentMonths:
 *                 type: integer
 *                 description: Tenure in months
 *               isDirect:
 *                 type: boolean
 *                 description: Direct P2P lending or not
 *               isCollateral:
 *                 type: boolean
 *                 description: Lender requires collateral for loan or not
 *               isDirectAddress:
 *                 type: string
 *                 description: Borrowers address. Required if isDirect is true
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
const update = async (req, res, next) => {
  try {
    const txnBuild = await lendingService.updateProposal(req.body);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/:
 *   delete:
 *     tags: [Lending Operations]
 *     summary: For deleting proposals created by Lender
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Lender Address
 *               proposalId:
 *                 type: integer
 *                 description: Proposal Unique ID
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
const remove = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const txnBuild = await lendingService.deleteProposal(from, proposalId);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/details/{proposalId}:
 *   get:
 *     tags: [Lending Operations]
 *     summary: For getting proposal details by proposal ID
 *     parameters:
 *     - in: path
 *       name: propsoalId
 *       schema:
 *         type: integer
 *       required: true
 *       description: Proposal Unique ID
 *     responses:
 *       200:
 *         description: Returns proposal details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposalListPointer:
 *                   type: string
 *                 owner:
 *                   type: string
 *                 amount:
 *                   type: string
 *                 interestRate:
 *                   type: string
 *                 instalmentMonths:
 *                   type: string
 *                 datesInfo:
 *                   type: object
 *                   properties:
 *                     createdDate:
 *                       type: string
 *                     updatedDate:
 *                       type: string
 *                 isCollateral:
 *                   type: boolean
 *                 collateralInfo:
 *                   type: object
 *                   properties:
 *                     collateralTypeAddress:
 *                       type: string
 *                     collateralPerPrice:
 *                       type: string
 *                     collateralTotalPrice:
 *                       type: string
 *                     collateralTokenQuantity:
 *                       type: string
 *                     collateralState:
 *                       type: string
 *                       description: INVALID,INPROGRESS,REQUESTED,RECEIVED,FAILED
 *                 directInfo:
 *                   type: object
 *                   properties:
 *                     isDirect:
 *                       type: boolean
 *                     isDirectAddress:
 *                       type: string
 *                 proposalState:
 *                   type: string
 *                   description: INACTIVE,ACTIVE,CLOSED
 *                 borrowDetails:
 *                   type: object
 *                   properties:
 *                     borrowerAddress:
 *                       type: string
 *                     borrowState:
 *                       type: string
 *                       description: INACTIVE,ACTIVE,CLOSED
 *                     receivedAmountStatus:
 *                       type: boolean
 *                     borrowerStatus:
 *                       type: boolean
 *                 earningDetails:
 *                   type: object
 *                   properties:
 *                     intrest:
 *                       type: string
 *                     totalAmount:
 *                       type: string
 *                     totalAdminShare:
 *                       type: string
 *                     monthlyAdminShare:
 *                       type: string
 *                     totalUserShare:
 *                       type: string
 *                     monthlyUserShare:
 *                       type: string
 *                     monthlyTotalShare:
 *                       type: string
 *                     completedInstallments:
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
const details = async (req, res, next) => {
  try {
    const { proposalId } = req.params;
    const proposalDetails = await lendingService.getProposalDetailsByID(proposalId);
    const decimals = await getDecimals('PROPOSAL');
    const resp = await formatter('proposalDetails', proposalDetails, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/count:
 *   get:
 *     tags: [Lending Operations]
 *     summary: To get the total proposal count
 *     responses:
 *       200:
 *         description: Returns total proposal count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposalCount:
 *                   type: string
 */
const count = async (req, res, next) => {
  try {
    const proposalCount = await lendingService.getProposalCount();
    res.send(new httpResponse(true, { proposalCount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/{user}/count:
 *   get:
 *     tags: [Lending Operations]
 *     summary: For getting proposal count of user
 *     parameters:
 *     - in: path
 *       name: user
 *       schema:
 *         type: string
 *       required: true
 *       description: User address
 *     responses:
 *       200:
 *         description: Returns total proposal count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposalCount:
 *                   type: string
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
 */
const userProposalCount = async (req, res, next) => {
  try {
    const { user } = req.params;
    const proposalCount = await lendingService.getUserProposalCount(user);
    res.send(new httpResponse(true, { proposalCount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /proposal/{user}/{index}:
 *   get:
 *     tags: [Lending Operations]
 *     summary: For getting proposal id of user at index
 *     parameters:
 *     - in: path
 *       name: user
 *       schema:
 *         type: string
 *       required: true
 *       description: User address
 *     - in: path
 *       name: index
 *       schema:
 *         type: string
 *       required: true
 *       description: index
 *     responses:
 *       200:
 *         description: Returns proposal ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposalId:
 *                   type: string
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
 *         description: NO_PROPOSAL/INVALID_PROPOSAL_INDEX
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: No proposal created by user/Can not find proposal.
 */
const userProposalIdByIndex = async (req, res, next) => {
  try {
    const { user, index } = req.params;
    const proposalId = await lendingService.getUserProposalAtIndex(user, index);
    res.send(new httpResponse(true, { proposalId }, null));
  } catch (e) {
    next(e);
  }
};

router.post('/', validate(validatorSchema.create, { keyByField: true }), boolInterceptor, create);
router.patch('/', validate(validatorSchema.create, { keyByField: true }), boolInterceptor, update);
router.delete('/', validate(validatorSchema.remove, { keyByField: true }), remove);

router.get(
  '/details/:proposalId',
  validate(validatorSchema.details, { keyByField: true }),
  details
);

router.get('/count', count);

router.get(
  '/:user/count',
  validate(validatorSchema.userProposalCount, { keyByField: true }),
  userProposalCount
);

router.get(
  '/:user/:index',
  validate(validatorSchema.userProposalIdByIndex, { keyByField: true }),
  userProposalIdByIndex
);

module.exports = router;
