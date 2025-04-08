import contracts from '../constants/contractDetails.js';
import { signTxnWithKMS, getBigNumberObject } from './transactionServices';
import { getContractInstance, confirmAdmin } from './commonServices';

const updateAdminShare = async (from, share, contract) => {
  const myContract = await getContractInstance(contract);
  await confirmAdmin(from, contract);
  const to = contracts[contract].address;
  const shareBN = await getBigNumberObject(share, 16);
  const gasLimit = await myContract.methods.updateAdminShare(shareBN).estimateGas({
    from,
  });
  const data = await myContract.methods.updateAdminShare(shareBN).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const setContractAddress = async (from, contract) => {
  const myContract = await getContractInstance(contract);
  await confirmAdmin(from, contract);
  const to = contracts[contract].address;
  const {
    TOKENS: { RTO },
    VAULT,
    ESCROWS,
    REGISTRY,
    PROPOSAL,
    PAYMENT,
  } = contracts;
  let serializedTx;
  if (contract === 'PAYMENT') {
    serializedTx = await updateExternalAccounts(from, REGISTRY.address, PROPOSAL.address, RTO);
  } else {
    const gasLimit = await myContract.methods
      .updateContractAddress(
        RTO.address,
        VAULT.address,
        ESCROWS.address.RTO,
        PROPOSAL.address,
        PAYMENT.address,
        RTO.admin
      )
      .estimateGas({
        from,
      });
    const data = await myContract.methods
      .updateContractAddress(
        RTO.address,
        VAULT.address,
        ESCROWS.address.RTO,
        PROPOSAL.address,
        PAYMENT.address,
        RTO.admin
      )
      .encodeABI();

    serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  }
  return serializedTx;
};

const setRolesInEscrow = async (from, code, depositer, withdrawer) => {
  const myContract = await getContractInstance(code + '_ESCROW');

  await confirmAdmin(from, code + '_ESCROW');

  const to = contracts.ESCROWS.address[code];
  const gasLimit = await myContract.methods.updateSubRoles(depositer, withdrawer).estimateGas({
    from,
  });
  const data = await myContract.methods.updateSubRoles(depositer, withdrawer).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const updateExternalAccounts = async (from, REGISTRY, PROPOSAL, RTO) => {
  const myContract = await getContractInstance('PAYMENT');
  await confirmAdmin(from, 'PAYMENT');
  const to = contracts['PAYMENT'].address;
  const gasLimit = await myContract.methods
    .updateExternalAccounts(REGISTRY, PROPOSAL, RTO)
    .estimateGas({
      from,
    });
  const data = await myContract.methods.updateExternalAccounts(REGISTRY, PROPOSAL, RTO).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const withdrawEscrowFund = async (from, receiver) => {
  const myContract = await getContractInstance('RTO_ESCROW');
  await confirmAdmin(from, 'RTO_ESCROW');
  const to = contracts.ESCROWS.address['RTO'];
  const amount = await myContract.methods.getCurrentBalance().call();
  const amountBN = getBigNumberObject(amount);
  const gasLimit = await myContract.methods.withdraw(receiver, amountBN).estimateGas({
    from,
  });
  const data = await myContract.methods.withdraw(receiver, amountBN).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

module.exports = {
  updateAdminShare,
  setContractAddress,
  setRolesInEscrow,
  updateExternalAccounts,
  withdrawEscrowFund,
};
