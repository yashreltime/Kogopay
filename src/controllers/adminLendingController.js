import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';
import _ from 'lodash';

import web3 from '../services/web3';
import validatorSchema from '../validators/adminLendingAPIValidators';
import httpResponse from '../models/httpResponseModel';
import lendingService from '../services/adminLendingServices';
import { getDecimals } from '../services/commonServices';
import { arrayFormatter } from '../services/dataFormatter';
import boolInterceptor from '../middleware/boolInterceptor';

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /proposal/admin/:
 *   post:
 *     tags: [Lending Operations - Admin]
 *     summary: For creating proposal by Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin Address
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
 *         description: INSUFFICIENT_RTO_BALANCE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Insufficient RTO Balance. Please recharge the account before trying again.
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
    const serializedApprovalTx = await lendingService.approvalForAdmin(req.body);
    const receiptForApproval = await web3.eth.sendSignedTransaction(serializedApprovalTx);
    const serializedProposalTx = await lendingService.createProposalByAdmin(req.body);
    const receiptForProposal = await web3.eth.sendSignedTransaction(serializedProposalTx);
    res.send(
      new httpResponse(
        true,
        { txnHash: [receiptForApproval.transactionHash, receiptForProposal.transactionHash] },
        null
      )
    );
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /proposal/admin/:
 *   patch:
 *     tags: [Lending Operations - Admin]
 *     summary: For updating proposals created by Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin Address
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
 *         description: Returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
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
    const serializedApprovalTx = await lendingService.approvalForAdmin(req.body);
    const receiptForApproval = await web3.eth.sendSignedTransaction(serializedApprovalTx);
    const serializedProposalTx = await lendingService.updateProposalByAdmin(req.body);
    const receiptForProposal = await web3.eth.sendSignedTransaction(serializedProposalTx);
    res.send(
      new httpResponse(
        true,
        { txnHash: [receiptForApproval.transactionHash, receiptForProposal.transactionHash] },
        null
      )
    );
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /proposal/admin/:
 *   delete:
 *     tags: [Lending Operations - Admin]
 *     summary: For deleting proposals created by Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin Address
 *               proposalId:
 *                 type: integer
 *                 description: Proposal Unique ID
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
    const serializedTx = await lendingService.deleteProposalByAdmin(from, proposalId);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /proposal/admin/count:
 *   get:
 *     tags: [Lending Operations - Admin]
 *     summary: To get the total proposal count created by Admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin Address
 *     responses:
 *       200:
 *         description: Returns proposal count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 proposalCount:
 *                   type: string
 */
const adminProposalCount = async (req, res, next) => {
  try {
    const { from } = req.body;
    const proposalCount = await lendingService.getAdminProposalCount(from);
    res.send(new httpResponse(true, { proposalCount }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /proposal/admin/index:
 *   get:
 *     tags: [Lending Operations - Admin]
 *     summary: To get the proposal ID at specific index
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Admin Address
 *               index:
 *                 type: integer
 *                 description: Index
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
const adminProposalIdByIndex = async (req, res, next) => {
  try {
    const { from, index } = req.body;
    const proposalId = await lendingService.getAdminProposalAtIndex(from, index);
    res.send(new httpResponse(true, { proposalId }, null));
  } catch (e) {
    next(e);
  }
};

router.post('/', validate(validatorSchema.create, { keyByField: true }), boolInterceptor, create);
router.patch('/', validate(validatorSchema.create, { keyByField: true }), boolInterceptor, update);
router.delete('/', validate(validatorSchema.remove, { keyByField: true }), remove);

router.get(
  '/count',
  validate(validatorSchema.proposalCount, { keyByField: true }),
  adminProposalCount
);

router.get(
  '/index',
  validate(validatorSchema.proposalIdByIndex, { keyByField: true }),
  adminProposalIdByIndex
);

module.exports = router;
