import mongoose from 'mongoose';

import DB_CONSTANTS from '../constants/dbConstants';

const Schema = mongoose.Schema;

const transactionSchema = new Schema(
  {
    _id: String,
    fromAddress: {
      type: String,
    },
    code: {
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

const Mint = mongoose.model('mintTransactions', transactionSchema);
module.exports = Mint;
