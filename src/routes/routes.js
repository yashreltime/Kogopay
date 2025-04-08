import express from 'express';
const router = express.Router();

import authAPIs from '../controllers/authController';
import transactionAPIs from '../controllers/transactionController';
import userAPIs from '../controllers/userController';
import adminLendingAPIs from '../controllers/adminLendingController';
import lendingAPIs from '../controllers/lendingController';
import borrowAPIs from '../controllers/borrowController';
import marketAPIs from '../controllers/marketController';
import instalmentAPIs from '../controllers/instalmentController';
import commonAPIs from '../controllers/commonController';
import jointAccountAPIs from '../controllers/jointAccountController';
import bridgingAPIs from '../controllers/bridgingController';
import swappingAPIs from '../controllers/swapController';

router.use('/auth', authAPIs);
router.use('/user', userAPIs);
router.use('/transaction', transactionAPIs);
router.use('/proposal/admin', adminLendingAPIs);
router.use('/proposal', lendingAPIs);
router.use('/borrow', borrowAPIs);
router.use('/market', marketAPIs);
router.use('/instalment', instalmentAPIs);
router.use('/common', commonAPIs);
router.use('/joint-account', jointAccountAPIs);
router.use('/bridge', bridgingAPIs);
router.use('/swap', swappingAPIs);

module.exports = router;
