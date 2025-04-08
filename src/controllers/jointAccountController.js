import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';
import BigNumber from 'bignumber.js';

import web3 from '../services/web3';
import validatorSchema from '../validators/jointAccountAPIValidators';
import httpResponse from '../models/httpResponseModel';
import boolInterceptor from '../middleware/boolInterceptor';
import jointAccountServices from '../services/jointAccountServices';

/**
 * @swagger
 * /joint-account/create:
 *   post:
 *     tags: [Joint Account]
 *     summary: For creating new Joint Account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               accountId:
 *                 type: string
 *                 description: Joint account unique id
 *               members:
 *                 type: string
 *                 description: Initial members
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
const create = async (req, res, next) => {
  try {
    const { accountId, from, members } = req.body;
    const txnBuild = await jointAccountServices.createNewAccount(accountId, from, members);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/account:
 *   get:
 *     tags: [Joint Account]
 *     summary: For getting joint account address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Joint account unique id
 *     responses:
 *       200:
 *         description: Returns account id and account address.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accountId:
 *                   type: string
 *                 accountAddress:
 *                   type: string
 *       462:
 *         description: UNKNOWN_ACCOUNT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid account id.
 */
const accountAddress = async (req, res, next) => {
  try {
    const { accountId } = req.body;
    const accountAddress = await jointAccountServices.getAccountAddress(accountId);
    if (BigNumber(accountAddress).isEqualTo(0)) {
      throw new Error('UNKNOWN_ACCOUNT');
    }
    res.send(new httpResponse(true, { accountId, accountAddress }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/invite:
 *   post:
 *     tags: [Joint Account]
 *     summary: For inviting new member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               member:
 *                 type: string
 *                 description: New member address
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
 *       462:
 *         description: EXISTING_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: User already member of the account / doesn't have ADMIN_ROLE
 */
const invite = async (req, res, next) => {
  try {
    const { from, account, members } = req.body;
    const txnBuild = await jointAccountServices.inviteMembers(from, account, members);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/join:
 *   post:
 *     tags: [Joint Account]
 *     summary: For accepting or rejecting invitation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               isAccepted:
 *                 type: string
 *                 description: accepting or rejecting.
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
 *       462:
 *         description: EXISTING_MEMBER / NOT_INVITED
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: User already member of the account / hasn't invited to the joint account.
 */
const join = async (req, res, next) => {
  try {
    const { from, account, isAccepted } = req.body;
    let txnBuild;
    if (isAccepted) {
      txnBuild = await jointAccountServices.acceptJoinRequest(from, account);
    } else {
      txnBuild = await jointAccountServices.rejectJoinRequest(from, account);
    }
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/remove:
 *   delete:
 *     tags: [Joint Account]
 *     summary: For removing member
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               member:
 *                 type: string
 *                 description: Member's address
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
 *       462:
 *         description: UNKNOWN_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Not a member / doesn't have ADMIN_ROLE.
 */
const remove = async (req, res, next) => {
  try {
    const { from, account, member } = req.body;
    const txnBuild = await jointAccountServices.removeMember(from, account, member);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/role:
 *   post:
 *     tags: [Joint Account]
 *     summary: For granting and revoking roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               member:
 *                 type: string
 *                 description: Member's address
 *               role:
 *                 type: string
 *                 description: DEPOSIT_ROLE, WITHDRAW_ROLE, DEFAULT_ROLE, MULTI_ROLE, ADMIN_ROLE
 *               isGranted:
 *                 type: boolean
 *                 description: granting or revoking
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
 *       462:
 *         description: UNKNOWN_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Not a member / doesn't have ADMIN_ROLE.
 */
const role = async (req, res, next) => {
  try {
    const { from, account, member, role, isGranted } = req.body;
    let txnBuild;
    if (isGranted) {
      txnBuild = await jointAccountServices.grantRole(from, account, member, role);
    } else {
      txnBuild = await jointAccountServices.revokeRole(from, account, member, role);
    }
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/deposit:
 *   post:
 *     tags: [Joint Account]
 *     summary: For depositing RTO to joint account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
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
 *       462:
 *         description: UNKNOWN_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Not a member / doesn't have DEPOSIT_ROLE or MULTI_ROLE
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
const deposit = async (req, res, next) => {
  try {
    const { from, account, to, amount } = req.body;
    const txnBuild = await jointAccountServices.deposit(from, account, amount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/withdraw:
 *   post:
 *     tags: [Joint Account]
 *     summary: For withdraw RTO from joint account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               to:
 *                 type: string
 *                 description: Receiver's address
 *               amount:
 *                 type: number
 *                 description: Amount to deposit
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
 *       462:
 *         description: UNKNOWN_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Not a member / doesn't have WITHDRAW_ROLE or MULTI_ROLE.
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
const withdraw = async (req, res, next) => {
  try {
    const { from, to, account, amount } = req.body;
    const txnBuild = await jointAccountServices.withdraw(from, to, account, amount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/status:
 *   patch:
 *     tags: [Joint Account]
 *     summary: For activating and deactivating account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               isDeleted:
 *                 type: boolean
 *                 description: Activating or Deactivating
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
 *       462:
 *         description: UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Doesn't have ADMIN_ROLE.
 */
const status = async (req, res, next) => {
  try {
    const { from, account, isDeleted } = req.body;
    const txnBuild = await jointAccountServices.changeStatus(from, account, isDeleted);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/withdraw-full:
 *   post:
 *     tags: [Joint Account]
 *     summary: For withdraw full account balance to Admin's account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
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
 *       462:
 *         description: UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Doesn't have ADMIN_ROLE.
 */
const withdrawFull = async (req, res, next) => {
  try {
    const { from, account, isClosed } = req.body;
    const txnBuild = await jointAccountServices.withdrawFull(from, account, isClosed);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/members:
 *   get:
 *     tags: [Joint Account]
 *     summary: To get all existing members
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *     responses:
 *       200:
 *         description: Returns existing members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Address of members.
 */
const members = async (req, res, next) => {
  try {
    const { account } = req.body;
    const members = await jointAccountServices.getMembers(account);
    res.send(new httpResponse(true, { members }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/count:
 *   get:
 *     tags: [Joint Account]
 *     summary: To get the number of members
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *     responses:
 *       200:
 *         description: Returns the number of members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 membersCount:
 *                   type: string
 */
const membersCount = async (req, res, next) => {
  try {
    const { account } = req.body;
    const membersCount = await jointAccountServices.getMembersCount(account);
    res.send(new httpResponse(true, { membersCount }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/invites:
 *   get:
 *     tags: [Joint Account]
 *     summary: To get all invites
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *     responses:
 *       200:
 *         description: Returns all invited members
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invitedUsers:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Address of members.
 */
const invites = async (req, res, next) => {
  try {
    const { account } = req.body;
    const invitedUsers = await jointAccountServices.getInvites(account);
    res.send(new httpResponse(true, { invitedUsers }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/owner:
 *   get:
 *     tags: [Joint Account]
 *     summary: To get owner of an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account:
 *                 type: string
 *                 description: Joint Account address
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
    const { account } = req.body;
    const owner = await jointAccountServices.getOwner(account);
    res.send(new httpResponse(true, { owner }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/ownership:
 *   patch:
 *     tags: [Joint Account]
 *     summary: For change owner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               newOwner:
 *                 type: string
 *                 description: New owner address
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
 *       462:
 *         description: UNKNOWN_MEMBER / UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Not a member / doesn't have ADMIN_ROLE.
 */
const contractOwnership = async (req, res, next) => {
  try {
    const { from, account, newOwner } = req.body;
    const txnBuild = await jointAccountServices.changeOwner(from, account, newOwner);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/root-admin:
 *   patch:
 *     tags: [Joint Account]
 *     summary: For change root admin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               newOwner:
 *                 type: string
 *                 description: New owner address
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
 *       462:
 *         description: UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Doesn't have ADMIN_ROLE.
 */
const rootAdmin = async (req, res, next) => {
  try {
    const { from, account, newOwner } = req.body;
    const txnBuild = await jointAccountServices.changeRootAdmin(from, account, newOwner);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

/**
 * @swagger
 * /joint-account/approve:
 *   patch:
 *     tags: [Joint Account]
 *     summary: For giving allowance to transfer RTO from joint account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *                 description: Joint Account owner address
 *               account:
 *                 type: string
 *                 description: Joint Account address
 *               amount:
 *                 type: string
 *                 description: Amount to be approved
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
 *       462:
 *         description: UNKNOWN_ROLE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Doesn't have WITHDRAW_ROLE.
 */
const approve = async (req, res, next) => {
  try {
    const { from, account, amount } = req.body;
    const txnBuild = await jointAccountServices.approve(from, account, amount);
    res.send(new httpResponse(true, { txnBuild }, null));
  } catch (e) {
    next(e);
  }
};

//!To Remove
const upgrade = async (req, res, next) => {
  try {
    const { address } = req.body;
    const signedTxn = await jointAccountServices.upgrade(address);
    const receipt = await web3.eth.sendSignedTransaction(signedTxn);
    res.send(new httpResponse(true, { txnHash: receipt.transactionHash }, null));
  } catch (e) {
    next(e);
  }
};

router.post('/create', validate(validatorSchema.create, { keyByField: true }), create);

router.get('/account', validate(validatorSchema.account, { keyByField: true }), accountAddress);

router.post('/invite', validate(validatorSchema.invite, { keyByField: true }), invite);

router.post('/join', validate(validatorSchema.join, { keyByField: true }), boolInterceptor, join);

router.delete('/remove', validate(validatorSchema.remove, { keyByField: true }), remove);

router.post('/role', validate(validatorSchema.role, { keyByField: true }), boolInterceptor, role);

router.post('/deposit', validate(validatorSchema.deposit, { keyByField: true }), deposit);

router.post('/withdraw', validate(validatorSchema.withdraw, { keyByField: true }), withdraw);

router.patch(
  '/status',
  validate(validatorSchema.status, { keyByField: true }),
  boolInterceptor,
  status
);

router.post(
  '/withdraw-full',
  validate(validatorSchema.withdrawFull, { keyByField: true }),
  withdrawFull
);

router.get('/members', validate(validatorSchema.get, { keyByField: true }), members);

router.get('/invites', validate(validatorSchema.get, { keyByField: true }), invites);

router.get('/count', validate(validatorSchema.get, { keyByField: true }), membersCount);

router.get('/owner', validate(validatorSchema.get, { keyByField: true }), owner);

router.patch(
  '/ownership',
  validate(validatorSchema.admin, { keyByField: true }),
  contractOwnership
);

router.patch('/root-admin', validate(validatorSchema.admin, { keyByField: true }), rootAdmin);

router.post('/approve', validate(validatorSchema.approve, { keyByField: true }), approve);

//!To Remove
router.post('/upgrade', upgrade);

module.exports = router;
