import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import web3 from '../services/web3';
import validatorSchema from '../validators/userAPIValidators';
import httpResponse from '../models/httpResponseModel';
import userService from '../services/userServices';
import { formatter } from '../services/dataFormatter';

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /user/:
 *   post:
 *     tags: [User Management]
 *     summary: For adding new user to blockchain
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
 *               user:
 *                 type: string
 *                 description: User's Address
 *     responses:
 *       200:
 *         description: On successfull creation returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
 *       460:
 *         description: EXISTING_USER
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: User already exist.
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
const create = async (req, res, next) => {
  try {
    const { from, user } = req.body;
    const serializedTx = await userService.createUser(from, user);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /user/:
 *   delete:
 *     tags: [User Management]
 *     summary: For deleting user from blockchain
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
 *               user:
 *                 type: string
 *                 description: User's Address
 *     responses:
 *       200:
 *         description: On successfull deletion returns transaction hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 txnHash:
 *                   type: string
 *                   description: Raw transaction hash
 *       460:
 *         description: ACTIVE_USER/INVALID_INDEX
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid User/User has active proposals.
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
const remove = async (req, res, next) => {
  try {
    const { from, user } = req.body;
    const serializedTx = await userService.deleteUser(from, user);
    const receipt = await web3.eth.sendSignedTransaction(serializedTx);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /user/count:
 *   get:
 *     tags: [User Management]
 *     summary: Returns total user count
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCount:
 *                   type: string
 */
const count = async (req, res, next) => {
  try {
    const userCount = await userService.getUserCount();
    res.send(new httpResponse(true, { userCount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /user/address/{index}:
 *   get:
 *     tags: [User Management]
 *     summary: Returns user's address at index
 *     parameters:
 *     - in: path
 *       name: index
 *       schema:
 *         type: integer
 *       required: true
 *       description: Index of user list
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userAddress:
 *                   type: string
 *       460:
 *         description: INVALID_INDEX
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Can not find user.
 */
const address = async (req, res, next) => {
  try {
    const { index } = req.params;
    const userAddress = await userService.getUserAddressAtIndex(index);
    res.send(new httpResponse(true, { userAddress }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /user/details/{user}:
 *   get:
 *     tags: [User Management]
 *     summary: Returns user's details
 *     parameters:
 *     - in: path
 *       name: user
 *       schema:
 *         type: string
 *       required: true
 *       description: Address of user
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   description: Application ID of user.
 *                 proposalIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Proposal IDs those created by user.
 *                 borrowings:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Proposal IDs those borrowed by user.
 *                 pendingRequests:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Proposal IDs those need to be accepted or rejected by user.
 *                 requestedProposals:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Proposal IDs those requested by user.
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
const details = async (req, res, next) => {
  try {
    const { user } = req.params;
    const userDetails = await userService.getUserDetailsByAddress(user);
    const resp = await formatter('userDetails', userDetails);
    res.send(new httpResponse(true, resp, null));
  } catch (e) {
    next(e);
  }
};

router.post('/', validate(validatorSchema.create, { keyByField: true }), create);
router.delete('/', validate(validatorSchema.remove, { keyByField: true }), remove);
router.get('/count', count);
router.get('/address/:index', validate(validatorSchema.address, { keyByField: true }), address);
router.get('/details/:user', validate(validatorSchema.details, { keyByField: true }), details);

module.exports = router;
