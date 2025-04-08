import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const accountSchema = new Schema(
  {
    _id: String,
    address: {
      type: String,
      index: true,
    },
    private: String,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

const BTCAccount = mongoose.model('btcAccount', accountSchema);
module.exports = BTCAccount;
