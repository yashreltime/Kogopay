import web3 from './web3';
import contracts from '../constants/contractDetails.js';
import { buildTransaction, getBigNumberObject, signTxnWithKMS } from './transactionServices';
import { processValue } from '../services/dataFormatter';
import {
  getContractInstance,
  verifyProposal,
  verifyUser,
  confirmAdmin,
  getDecimals,
} from './commonServices';

const PROPOSAL = 'PROPOSAL';
const PAYMENT = 'PAYMENT';

const calculateMonthlyInstalmentAmount = async (from, proposalId) => {
  const myContract = await getContractInstance(PAYMENT);
  await verifyUser(from);
  await verifyProposal(proposalId);
  const data = await myContract.methods.getMonthlyTokenInstalmentAmount(proposalId).call({ from });
  return data;
};

const calculatePendingCollateral = async (from, proposalId, unitPrice) => {
  const myContract = await getContractInstance(PAYMENT);
  await verifyUser(from);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);
  const decimals = await getDecimals(PAYMENT);
  const unitPriceInHex = getBigNumberObject(unitPrice, decimals);
  const amount = await myContract.methods
    .toCalculatePendingCollateral(proposalId, unitPriceInHex)
    .call({ from });
  const data = processValue(amount, decimals);
  return data;
};

const calculatePendingInstalmentCount = async (from, proposalId) => {
  const myContract = await getContractInstance(PAYMENT);
  await verifyUser(from);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);
  const data = await myContract.methods.calculatePendingInstalments(proposalId).call({ from });
  return data;
};

const calculatePendingTokenAmount = async (from, proposalId) => {
  const myContract = await getContractInstance(PAYMENT);
  await verifyUser(from);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);
  const data = await myContract.methods.toCalculatePendingTokens(proposalId).call({ from });
  return data;
};

const payMonthlyInstalment = async (from, proposalId, count, amount, paymentAddress) => {
  const myContract = await getContractInstance(PAYMENT);

  await verifyUser(from);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);

  const to = contracts[PAYMENT].address;
  const decimals = await getDecimals(PAYMENT);
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods
    .toPayInstalments(proposalId, count, amountInHex, paymentAddress)
    .estimateGas({
      from,
    });

  const data = await myContract.methods
    .toPayInstalments(proposalId, count, amountInHex, paymentAddress)
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const payDelayedInstalmentFromCollateral = async (from, proposalId, collateral, unitPrice) => {
  const myContract = await getContractInstance(PAYMENT);

  await confirmAdmin(from, PAYMENT);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);

  const to = contracts[PAYMENT].address;
  const decimals = await getDecimals(PAYMENT);
  const unitPriceInHex = getBigNumberObject(unitPrice, decimals);
  const collateralAddress = contracts.ESCROWS.address[collateral];
  const gasLimit = await myContract.methods
    .delayPayment(proposalId, collateralAddress, unitPriceInHex)
    .estimateGas({
      from,
    });

  const data = await myContract.methods
    .delayPayment(proposalId, collateralAddress, unitPriceInHex)
    .encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const fullPayment = async (from, proposalId, amount, paymentAddress) => {
  const myContract = await getContractInstance(PAYMENT);

  await verifyUser(from);
  await verifyProposal(proposalId);
  await confirmProposalStatus(from, proposalId);

  const to = contracts[PAYMENT].address;
  const decimals = await getDecimals(PAYMENT);
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods
    .fullPaymentClose(proposalId, amountInHex, paymentAddress)
    .estimateGas({
      from,
    });

  const data = await myContract.methods
    .fullPaymentClose(proposalId, amountInHex, paymentAddress)
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

const getProposalClosedStatus = async (from, proposalId) => {
  const myContract = await getContractInstance(PAYMENT);
  await verifyUser(from);
  await verifyProposal(proposalId);
  const data = await myContract.methods.closeProposalStatus(proposalId).call({ from });
  return data;
};

const closeProposal = async (from, proposalId) => {
  await confirmAdmin(from, PAYMENT);
  await verifyProposal(proposalId);
  const closeStatus = await getProposalClosedStatus(from, proposalId);
  if (!closeStatus) {
    throw new Error("CAN'T_CLOSE");
  }
  const receipt = [];
  const txn1 = await sendCloseProposalRequest(from, proposalId, PAYMENT, 'closeProposalRequest');
  receipt.push(txn1.transactionHash);
  const txn2 = await sendCloseProposalRequest(from, proposalId, PROPOSAL, 'updateCloseStatus');
  receipt.push(txn2.transactionHash);
  return receipt;
};

const sendCloseProposalRequest = async (from, proposalId, contract, functionName) => {
  const myContract = await getContractInstance(contract);
  const functionBind = myContract.methods[functionName];
  const to = contracts[contract].address;
  const gasLimit = await functionBind(proposalId).estimateGas({
    from,
  });
  const data = await functionBind(proposalId).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  const receipt = await web3.eth.sendSignedTransaction(serializedTx);
  return receipt;
};

const confirmProposalStatus = async (from, proposalId) => {
  const closeStatus = await getProposalClosedStatus(from, proposalId);
  if (closeStatus) {
    throw new Error('CLOSED_STATE');
  }
  return true;
};

module.exports = {
  calculateMonthlyInstalmentAmount,
  calculatePendingCollateral,
  calculatePendingInstalmentCount,
  calculatePendingTokenAmount,
  payMonthlyInstalment,
  payDelayedInstalmentFromCollateral,
  fullPayment,
  getProposalClosedStatus,
  closeProposal,
};
