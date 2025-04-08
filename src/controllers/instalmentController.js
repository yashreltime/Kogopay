import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import web3 from '../services/web3';
import validatorSchema from '../validators/instalmentAPIValidators';
import httpResponse from '../models/httpResponseModel';
import instalmentService from '../services/instalmentServices';
import txnService from '../services/transactionServices';
import { getDecimals } from '../services/commonServices';
import { formatter } from '../services/dataFormatter';

/**
 * @swagger
 * /instalment/monthly-amount:
 *   get:
 *     tags: [Instalment Operations]
 *     summary: To get monthly payment details
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
 *     responses:
 *       200:
 *         description: Returns monthly payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthlyAdminShare:
 *                   type: string
 *                 monthlyUserShare:
 *                   type: string
 *                 monthlyTotal:
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
const instalmentAmount = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const data = await instalmentService.calculateMonthlyInstalmentAmount(from, proposalId);
    const decimals = await getDecimals('PAYMENT');
    const resp = await formatter('monthlyInstalment', data, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/pending-collateral:
 *   get:
 *     tags: [Instalment Operations]
 *     summary: To get pending collateral amount on specific proposal
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
 *               unitPrice:
 *                 type: integer
 *                 description: Unit price rate of collateral
 *     responses:
 *       200:
 *         description: Returns pending collateral amount on specific proposal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingCollateralAmount:
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
const pendingCollateral = async (req, res, next) => {
  try {
    const { from, proposalId, unitPrice } = req.body;
    const pendingCollateralAmount = await instalmentService.calculatePendingCollateral(
      from,
      proposalId,
      unitPrice
    );
    res.send(new httpResponse(true, { pendingCollateralAmount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/pending-instalments:
 *   get:
 *     tags: [Instalment Operations]
 *     summary: To get pending instalment count on specific proposal
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
 *     responses:
 *       200:
 *         description: Returns pending instalment count on specific proposal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingInstalmentCount:
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
const pendingInstalments = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const pendingInstalmentCount = await instalmentService.calculatePendingInstalmentCount(
      from,
      proposalId
    );
    res.send(new httpResponse(true, { pendingInstalmentCount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/pending-tokens:
 *   get:
 *     tags: [Instalment Operations]
 *     summary: To get pending token count on specific proposal
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
 *     responses:
 *       200:
 *         description: Returns pending token count on specific proposal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingTokenAmount:
 *                   type: string
 *                 adminShare:
 *                   type: string
 *                 userShare:
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
const pendingTokens = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const pendingTokenAmounts = await instalmentService.calculatePendingTokenAmount(
      from,
      proposalId
    );
    const decimals = await getDecimals('PAYMENT');
    const resp = await formatter('pendingTokens', pendingTokenAmounts, decimals);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/pay:
 *   post:
 *     tags: [Instalment Operations]
 *     summary: To pay monthly instalment amount
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
 *               instalmentCount:
 *                 type: integer
 *                 description: Number of instalment
 *               instalmentAmount:
 *                 type: integer
 *                 description: Monthly paying amount
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
const payInstalment = async (req, res, next) => {
  try {
    const { from, proposalId, instalmentCount, instalmentAmount, paymentAddress } = req.body;
    const txnBuild = await instalmentService.payMonthlyInstalment(
      from,
      proposalId,
      instalmentCount,
      instalmentAmount,
      paymentAddress
    );

    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /instalment/pay-collateral:
 *   post:
 *     tags: [Instalment Operations]
 *     summary: To pay monthly instalment amount from collateral.
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
 *               collateral:
 *                 type: integer
 *                 description: Collateral type
 *               unitPrice:
 *                 type: integer
 *                 description: Unit price rate of collateral
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
const payDelayedInstalment = async (req, res, next) => {
  try {
    const { from, proposalId, collateral, unitPrice } = req.body;
    const serializedTx = await instalmentService.payDelayedInstalmentFromCollateral(
      from,
      proposalId,
      collateral,
      unitPrice
    );
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/one-time:
 *   post:
 *     tags: [Instalment Operations]
 *     summary: To pay pending amount and close the loan in single instalment
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
 *               amount:
 *                 type: integer
 *                 description: Paying amount
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
const fullPayment = async (req, res, next) => {
  try {
    const { from, proposalId, amount, paymentAddress } = req.body;
    const txnBuild = await instalmentService.fullPayment(from, proposalId, amount, paymentAddress);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /instalment/close-status:
 *   get:
 *     tags: [Instalment Operations]
 *     summary: To check if the loan can be closed by admin
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
 *     responses:
 *       200:
 *         description: Returns loan close status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 closed:
 *                   type: boolean
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
const proposalCloseStatus = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const closed = await instalmentService.getProposalClosedStatus(from, proposalId);
    res.send(new httpResponse(true, { closed }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /instalment/close:
 *   post:
 *     tags: [Instalment Operations]
 *     summary: To close the loan by admin
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
const closeProposal = async (req, res, next) => {
  try {
    const { from, proposalId } = req.body;
    const receipt = await instalmentService.closeProposal(from, proposalId);

    res.send(
      new httpResponse(
        true,
        {
          data: 'Proposal closed successfully!',
          txnHash: receipt,
        },
        null
      )
    );
  } catch (e) {
    next(e);
  }
};

router.get(
  '/monthly-amount',
  validate(validatorSchema.amount, { keyByField: true }),
  instalmentAmount
);

router.get(
  '/pending-collateral',
  validate(validatorSchema.collateral, { keyByField: true }),
  pendingCollateral
);

router.get(
  '/pending-instalments',
  validate(validatorSchema.pendingInstalment, { keyByField: true }),
  pendingInstalments
);

router.get(
  '/pending-tokens',
  validate(validatorSchema.pendingTokens, { keyByField: true }),
  pendingTokens
);

router.post('/pay', validate(validatorSchema.pay, { keyByField: true }), payInstalment);

router.post(
  '/pay-collateral',
  validate(validatorSchema.delayed, { keyByField: true }),
  payDelayedInstalment
);

router.post('/one-time', validate(validatorSchema.full, { keyByField: true }), fullPayment);

router.get(
  '/close-status',
  validate(validatorSchema.close, { keyByField: true }),
  proposalCloseStatus
);

router.post('/close', validate(validatorSchema.close, { keyByField: true }), closeProposal);

module.exports = router;
