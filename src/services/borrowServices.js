import contracts from '../constants/contractDetails.js';
import { getContractInstance, verifyUser, verifyProposal, getDecimals } from './commonServices';
import { buildTransaction, getBigNumberObject } from './transactionServices';

const PROPOSAL = 'PROPOSAL';

const calculateCollateral = async (amount, interest, decimals) => {
  const myContract = await getContractInstance(PROPOSAL);
  const amountInHex = getBigNumberObject(amount, decimals);
  const interestInHex = getBigNumberObject(interest, decimals);
  const data = await myContract.methods
    .calcCollateralAmountTable(amountInHex, interestInHex)
    .call();
  return data;
};

const acceptRequestWithCollateral = async (
  from,
  proposalId,
  collateralCode,
  collateralAmount,
  collateralperUnitPrice
) => {
  const myContract = await getContractInstance(PROPOSAL);

  await verifyUser(from);
  await verifyProposal(proposalId);

  const decimals = await getDecimals(`${collateralCode}_ESCROW}`);
  const amountInHex = getBigNumberObject(collateralAmount, decimals);
  const priceInHex = getBigNumberObject(collateralperUnitPrice, decimals);
  const to = contracts[PROPOSAL].address;
  const collateralAddress = contracts.ESCROWS.address[collateralCode];
  const gasLimit = await myContract.methods
    .acceptRequestWithCollateral(proposalId, collateralAddress, amountInHex, priceInHex)
    .estimateGas({
      from,
    });
  const data = await myContract.methods
    .acceptRequestWithCollateral(proposalId, collateralAddress, amountInHex, priceInHex)
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const acceptRequest = async (from, proposalId) => {
  const myContract = await getContractInstance(PROPOSAL);

  await verifyUser(from);
  await verifyProposal(proposalId);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.acceptRequestWithoutCollateral(proposalId).estimateGas({
    from,
  });
  const data = await myContract.methods.acceptRequestWithoutCollateral(proposalId).encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const rejectRequest = async (from, proposalId) => {
  const myContract = await getContractInstance(PROPOSAL);

  await verifyUser(from);
  await verifyProposal(proposalId);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.rejectRequestByBorrower(proposalId).estimateGas({
    from,
  });
  const data = await myContract.methods.rejectRequestByBorrower(proposalId).encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

module.exports = {
  calculateCollateral,
  acceptRequestWithCollateral,
  acceptRequest,
  rejectRequest,
};
