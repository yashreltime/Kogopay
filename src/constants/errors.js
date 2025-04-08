module.exports = Object.freeze({
  SERVER_ERROR: {
    status: 500,
    message: 'Internal Server Error.',
  },
  VALIDATION_ERROR: {
    status: 400,
    message: 'Validation Failed.',
  },
  INSUFFICIENT_BALANCE: {
    status: 420,
    message: 'Insufficient Balance. Please recharge the account before trying again.',
  },
  INSUFFICIENT_RTO_BALANCE: {
    status: 420,
    message: 'Insufficient EURO (RTO) Balance. Please recharge the account before trying again.',
  },
  INSUFFICIENT_RTC_BALANCE: {
    status: 420,
    message: 'Insufficient RTC Balance. Please recharge the account before trying again.',
  },
  INVALID_NONCE: {
    status: 460,
    message: 'Trying to resend a confirmed transaction. Please build a new transaction and resend.',
  },
  UNAUTHORIZED_ERROR: {
    status: 401,
    message: 'Unauthorized Error',
  },
  CORS_DISABLED: {
    status: 403,
    message: 'CORS Disabled',
  },
  EXISTING_USER: {
    status: 460,
    message: 'User already exist.',
  },
  INVALID_USER: {
    status: 460,
    message: 'Invalid User.',
  },
  INVALID_INDEX: {
    status: 460,
    message: 'Can not find user.',
  },
  ACTIVE_USER: {
    status: 460,
    message: 'User has active proposals.',
  },
  EXISTING_PROPOSAL: {
    status: 461,
    message: 'Proposal already exist.',
  },
  INVALID_PROPOSAL: {
    status: 461,
    message: 'Invalid Proposal.',
  },
  NO_PROPOSAL: {
    status: 461,
    message: 'No proposal created by user.',
  },
  INVALID_PROPOSAL_INDEX: {
    status: 461,
    message: 'Can not find proposal.',
  },
  CLOSED_STATE: {
    status: 461,
    message: 'Proposal in close state.',
  },
  "CAN'T_CLOSE": {
    status: 461,
    message: 'Proposal is not in close state.',
  },
  UNKNOWN_SIGNATURE: {
    status: 401,
    message: 'Signature is undefined.',
  },
  ADMIN_ONLY: {
    status: 401,
    message: 'Restricted to admin only',
  },
  EXISTING_MEMBER: {
    status: 462,
    message: 'User is already a member of the account.',
  },
  UNKNOWN_MEMBER: {
    status: 462,
    message: 'Not a member.',
  },
  UNKNOWN_ROLE: {
    status: 462,
    message: 'Member does not have the role.',
  },
  INVITED: {
    status: 462,
    message: 'User already invited.',
  },
  NOT_INVITED: {
    status: 462,
    message: 'Member has not invited.',
  },
  UNKNOWN_ACCOUNT: {
    status: 462,
    message: 'Invalid account id.',
  },
  EXISTIING_ACCOUNT: {
    status: 462,
    message: 'Existing account id.',
  },
});
