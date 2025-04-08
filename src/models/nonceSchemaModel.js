import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const nonceSchema = new Schema(
  {
    _id: {
      type: String,
      default: '0x0',
    },
    RTC: {
      type: Number,
      default: 0,
    },
    ETH: {
      type: Number,
      default: 0,
    },
    BNB: {
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

const Nonce = mongoose.model('nonceCounts', nonceSchema);
export default Nonce;
