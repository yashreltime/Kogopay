import contracts from '../constants/contractDetails.js';
import cmnServices from './commonServices';
import { buildTransaction, getBigNumberObject } from './transactionServices';

const PROPOSAL = 'PROPOSAL';

const createProposal = async (params) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  let {
    from,
    proposalId,
    amount,
    interestRate,
    instalmentMonths,
    isCollateral,
    isDirect,
    isDirectAddress,
  } = params;
  const to = contracts[PROPOSAL].address;

  await cmnServices.verifyUser(from);
  if (await cmnServices.isProposal(proposalId)) {
    throw new Error('EXISTING_PROPOSAL');
  }
  if (!isDirect) {
    isDirectAddress = from;
  } else {
    await cmnServices.verifyUser(isDirectAddress);
  }
  const decimals = await cmnServices.getDecimals(PROPOSAL);
  const amountInHex = getBigNumberObject(amount, decimals);
  const interestRateInHex = getBigNumberObject(interestRate, decimals);
  const totalAmount = cmnServices.calculateTotalAmount(amount, interestRate, instalmentMonths);
  const totalAmountInHex = getBigNumberObject(totalAmount, decimals);
  const gasLimit = await myContract.methods
    .createProposal(
      proposalId,
      amountInHex,
      totalAmountInHex,
      interestRateInHex,
      instalmentMonths,
      isCollateral,
      isDirect,
      isDirectAddress
    )
    .estimateGas({
      from,
    });
  const data = await myContract.methods
    .createProposal(
      proposalId,
      amountInHex,
      totalAmountInHex,
      interestRateInHex,
      instalmentMonths,
      isCollateral,
      isDirect,
      isDirectAddress
    )
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const updateProposal = async (params) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  let {
    from,
    proposalId,
    amount,
    interestRate,
    instalmentMonths,
    isCollateral,
    isDirect,
    isDirectAddress,
  } = params;

  await cmnServices.verifyUser(from);
  await cmnServices.verifyProposal(proposalId);
  if (!isDirect) {
    isDirectAddress = from;
  } else {
    await cmnServices.verifyUser(isDirectAddress);
  }
  const decimals = await cmnServices.getDecimals(PROPOSAL);
  const amountInHex = getBigNumberObject(amount, decimals);
  const interestRateInHex = getBigNumberObject(interestRate, decimals);
  const totalAmount = cmnServices.calculateTotalAmount(amount, interestRate, instalmentMonths);
  const totalAmountInHex = getBigNumberObject(totalAmount, decimals);
  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods
    .updateProposal(
      proposalId,
      amountInHex,
      totalAmountInHex,
      interestRateInHex,
      instalmentMonths,
      isCollateral,
      isDirect,
      isDirectAddress
    )
    .estimateGas({
      from,
    });
  const data = await myContract.methods
    .updateProposal(
      proposalId,
      amountInHex,
      totalAmountInHex,
      interestRateInHex,
      instalmentMonths,
      isCollateral,
      isDirect,
      isDirectAddress
    )
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const deleteProposal = async (from, proposalId) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyProposal(proposalId);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.deleteProposal(proposalId).estimateGas({
    from,
  });
  const data = await myContract.methods.deleteProposal(proposalId).encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const getProposalCount = async () => {
  const myContract = await cmnServices.getContractInstance('PROPOSAL');
  const data = await myContract.methods.getProposalCount().call();
  return data;
};

const getUserProposalCount = async (from) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  const data = await myContract.methods.getUserProposalCount().call({ from });
  return data;
};

const getUserProposalAtIndex = async (from, index) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  const userProposalCount = await getUserProposalCount(from);
  if (userProposalCount === '0') {
    throw new Error('NO_PROPOSAL');
  } else if (index >= userProposalCount) {
    throw new Error('INVALID_PROPOSAL_INDEX');
  }
  const data = await myContract.methods.getUserProposalAtIndex(from, index).call({ from });
  return data;
};

const getProposalDetailsByID = async (proposalId) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyProposal(proposalId);
  const data = await myContract.methods.proposalStructs(proposalId).call();
  return data;
};

const getBorrowRequests = async (from, proposalId) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyProposal(proposalId);
  const data = await myContract.methods.getBorrowRequests(proposalId).call({ from });
  return data;
};

const acceptBorrowRequest = async (from, proposalId, borrower, accept) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);

  await cmnServices.verifyUser(from);
  await cmnServices.verifyUser(borrower);
  await cmnServices.verifyProposal(proposalId);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods
    .confirmProposalRequest(proposalId, borrower, accept)
    .estimateGas({
      from,
    });
  const data = await myContract.methods
    .confirmProposalRequest(proposalId, borrower, accept)
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

module.exports = {
  createProposal,
  updateProposal,
  deleteProposal,
  getProposalCount,
  getUserProposalCount,
  getUserProposalAtIndex,
  getProposalDetailsByID,
  getBorrowRequests,
  acceptBorrowRequest,
};
