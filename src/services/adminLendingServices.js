import contracts from '../constants/contractDetails.js';
import cmnServices from './commonServices';
import { getBigNumberObject, signTxnWithKMS, checkBalance } from './transactionServices';

const PROPOSAL = 'PROPOSAL';

const approvalForAdmin = async (params) => {
  const { from, amount } = params;
  const coinCode = 'RTO';
  const spender = contracts.ESCROWS.address[coinCode];
  const myContract = await cmnServices.getContractInstance(coinCode);

  await checkBalance(from, amount, coinCode);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);

  const decimals = await cmnServices.getDecimals(coinCode);
  const to = contracts.TOKENS[coinCode].address;
  const amountInHex = getBigNumberObject(amount, decimals);

  const gasLimit = await myContract.methods.approve(spender, amountInHex).estimateGas({
    from,
  });
  const data = await myContract.methods.approve(spender, amountInHex).encodeABI();

  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'RTO');
  return serializedTx;
};

const createProposalByAdmin = async (params) => {
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

  //Validations
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
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
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'RTO');
  return serializedTx;
};

const updateProposalByAdmin = async (params) => {
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

  //Validations
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
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
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'RTO');
  return serializedTx;
};

const deleteProposalByAdmin = async (from, proposalId) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);

  //Validations
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
  await cmnServices.verifyProposal(proposalId);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.deleteProposal(proposalId).estimateGas({
    from,
  });
  const data = await myContract.methods.deleteProposal(proposalId).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'RTO');
  return serializedTx;
};

const getBorrowRequestsToAdmin = async (from, proposalId) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
  await cmnServices.verifyProposal(proposalId);
  const data = await myContract.methods.getBorrowRequests(proposalId).call({ from });
  return data;
};

const acceptBorrowRequestByAdmin = async (from, proposalId, borrower, accept) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);

  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
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
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'RTO');
  return serializedTx;
};

const getAdminProposalCount = async (from) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
  const data = await myContract.methods.getUserProposalCount().call({ from });
  return data;
};

const getAdminProposalAtIndex = async (from, index) => {
  const myContract = await cmnServices.getContractInstance(PROPOSAL);
  await cmnServices.verifyUser(from);
  await cmnServices.verifyAdmin(from);
  const userProposalCount = await getAdminProposalCount(from);
  if (userProposalCount === '0') {
    throw new Error('NO_PROPOSAL');
  } else if (index >= userProposalCount) {
    throw new Error('INVALID_PROPOSAL_INDEX');
  }
  const data = await myContract.methods.getUserProposalAtIndex(from, index).call({ from });
  return data;
};

module.exports = {
  approvalForAdmin,
  createProposalByAdmin,
  updateProposalByAdmin,
  deleteProposalByAdmin,
  getBorrowRequestsToAdmin,
  acceptBorrowRequestByAdmin,
  getAdminProposalCount,
  getAdminProposalAtIndex,
};
