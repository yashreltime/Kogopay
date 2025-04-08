import express from 'express';
const router = express.Router();
import { validate } from 'express-validation';

import validatorSchema from '../validators/authAPIValidators';
import { generateTokens, refreshTokens } from '../services/authService';
import httpResponse from '../models/httpResponseModel';
import config from '../config/env';

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: For authentication to blockchain backend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: username or email
 *               password:
 *                 type: string
 *                 description: password
 *     responses:
 *       200:
 *         description: A pair of tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Must use with every API call
 *                 refreshToken:
 *                   type: string
 *                   description: To regenerate an expired accessToken
 *       401:
 *         description: UNAUTHORIZED_ERROR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized Error
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (username !== config.USERNAME || password !== config.PASSWORD) {
      throw new Error('UNAUTHORIZED_ERROR');
    }
    const tokens = await generateTokens();
    res.send(new httpResponse(true, tokens, null));
  } catch (e) {
    next(e);
  }
};

//Add @swagger tag to jsdoc start to get documented by swagger
/**
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: For regenerating expired access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: A pair of new tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: Must use with every API call
 *                 refreshToken:
 *                   type: string
 *                   description: To regenerate an expired accessToken
 */
const refreshAuthTokens = async (req, res, next) => {
  try {
    const { token } = req.body;
    const tokens = await refreshTokens(token);
    res.send(new httpResponse(true, tokens, null));
  } catch (e) {
    next(e);
  }
};

router.post('/login', validate(validatorSchema.login, { keyByField: true }), login);
router.post('/refresh', validate(validatorSchema.refresh, { keyByField: true }), refreshAuthTokens);

module.exports = router;
