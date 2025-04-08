import mongoose from 'mongoose';

import DB_CONSTANTS from '../constants/dbConstants';

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    _id: String,
    swapId: {
      type: Number,
      unique: true,
    },
    fromAddress: {
      type: String,
    },
    fromToken: {
      type: String,
    },
    fromAmount: {
      type: String,
    },
    toToken: {
      type: String,
    },
    toAmount: {
      type: String,
    },
    raw: {
      type: Object,
    },
    status: {
      type: Number,
      enum: Object.values(DB_CONSTANTS.TXN_STATUS),
      default: DB_CONSTANTS.TXN_STATUS.NOT_PROCESSED,
      index: true,
    },
    mintStatus: {
      type: Number,
      enum: Object.values(DB_CONSTANTS.MINT_STATUS),
      default: DB_CONSTANTS.MINT_STATUS.NOT_MINTED,
      index: true,
    },
    burnStatus: {
      type: Number,
      enum: Object.values(DB_CONSTANTS.BURN_STATUS),
      default: DB_CONSTANTS.BURN_STATUS.NOT_BURNED,
      index: true,
    },
    tries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const Swap = mongoose.model('swapTransactions', transactionSchema);
module.exports = Swap;
