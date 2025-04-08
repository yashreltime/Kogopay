import { default as Common } from '@ethereumjs/common';
import { Transaction as Tx } from '@ethereumjs/tx';
import BigNumber from 'bignumber.js';

import web3 from './web3';
import config from '../config/env';
import contracts from '../constants/contractDetails.js';
import network from '../constants/networks';
import { buildTransaction, getBigNumberObject, checkBalance } from './transactionServices';
import { getContractInstance, getDecimals } from './commonServices';
import { processValue } from './dataFormatter';
import { getNonce } from './nonceManagerService';

const JOINT_ACCOUNT = 'JOINT_ACCOUNT';
const JOINT_ACCOUNT_FACTORY = 'JOINT_ACCOUNT_FACTORY';
const JOINT_ACCOUNT_BEACON = 'JOINT_ACCOUNT_BEACON';
const RTO = 'RTO';
const RTC = 'RTC';

const getJointAccountContractInstance = async (address) => {
  const { abi } = contracts[JOINT_ACCOUNT];
  return await new web3.eth.Contract(abi, address);
};

const getRoleCode = async (role, account) => {
  const myContract = await getJointAccountContractInstance(account);
  const roleCode = await myContract.methods[role]().call();
  return roleCode;
};

const createNewAccount = async (accountId, from, members) => {
  const myContract = await getContractInstance(JOINT_ACCOUNT_FACTORY);
  const accountAddress = await getAccountAddress(accountId);

  if (!BigNumber(accountAddress).isEqualTo(0)) {
    throw new Error('EXISTING_ACCOUNT');
  }

  const to = contracts[JOINT_ACCOUNT_FACTORY].address;
  const { ADMIN_ADDRESS } = config;
  const stableCoin = contracts.TOKENS.RTO.address;
  const gasLimit = await myContract.methods
    .addJointAccount(accountId, from, members, ADMIN_ADDRESS, stableCoin)
    .estimateGas({
      from,
    });
  const data = await myContract.methods
    .addJointAccount(accountId, from, members, ADMIN_ADDRESS, stableCoin)
    .encodeABI();
  const txn = await buildTransaction(from, to, gasLimit, data);
  return txn;
};

//!TO remove
// const upgrade = async (address) => {
//   const myContract = await getContractInstance(JOINT_ACCOUNT_BEACON);

//   const to = contracts.JOINT_ACCOUNT_BEACON.address;
//   const from = config.ADMIN_ADDRESS;
//   const gasLimit = await myContract.methods.update(address).estimateGas({
//     from,
//   });
//   const data = await myContract.methods.update(address).encodeABI();
//   const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
//   return serializedTx;
// };

const getAccountAddress = async (accountId) => {
  const myContract = await getContractInstance(JOINT_ACCOUNT_FACTORY);
  const data = await myContract.methods.getAccountAddress(accountId).call();
  return data;
};

const inviteMembers = async (from, account, members) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);
  await isMembers(account, members);
  await confirmNotInvited(account, members);

  const gasLimit = await myContract.methods.addMember(members).estimateGas({
    from,
  });
  const data = await myContract.methods.addMember(members).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const acceptJoinRequest = async (from, account) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmInvitation(account, from);

  const gasLimit = await myContract.methods.statusUpdateByMember(true).estimateGas({
    from,
  });
  const data = await myContract.methods.statusUpdateByMember(true).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const rejectJoinRequest = async (from, account) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmInvitation(account, from);

  const gasLimit = await myContract.methods.statusUpdateByMember(false).estimateGas({
    from,
  });
  const data = await myContract.methods.statusUpdateByMember(false).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const removeMember = async (from, account, member) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);
  await confirmMember(account, member);

  const gasLimit = await myContract.methods.removeMember(member).estimateGas({
    from,
  });
  const data = await myContract.methods.removeMember(member).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const grantRole = async (from, account, member, role) => {
  const myContract = await getJointAccountContractInstance(account);
  const roleCode = await getRoleCode(role, account);

  await confirmRole(account, from, ['ADMIN_ROLE']);
  await confirmMember(account, member);

  const gasLimit = await myContract.methods.grantRoleAccess(roleCode, member).estimateGas({
    from,
  });
  const data = await myContract.methods.grantRoleAccess(roleCode, member).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const revokeRole = async (from, account, member, role) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);
  await confirmMember(account, member);

  const roleCode = await getRoleCode(role, account);
  const gasLimit = await myContract.methods.revokeRoleAccess(roleCode, member).estimateGas({
    from,
  });
  const data = await myContract.methods.revokeRoleAccess(roleCode, member).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const deposit = async (from, account, amount) => {
  const myContract = await getJointAccountContractInstance(account);
  // const adminShare = await getAdminShare(account);

  await confirmMember(account, from);
  await confirmRole(account, from, ['ADMIN_ROLE', 'DEPOSIT_ROLE']);
  await checkBalance(from, amount, RTO);
  // await checkBalance(from, adminShare, RTC);

  const decimals = await getDecimals(RTO);
  const nonce_count = await getNonce(RTO, from);
  // const value = getBigNumberObject(adminShare, 18);

  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods
    .p2pTransfer(from, account, amountInHex, true)
    .estimateGas({
      from,
    });
  const data = await myContract.methods.p2pTransfer(from, account, amountInHex, true).encodeABI();

  const txObject = {
    from,
    to: account,
    nonce: await web3.utils.toHex(nonce_count),
    gasPrice: '0x0',
    gasLimit: await web3.utils.toHex(gasLimit),
    data,
  };
  const common = Common.custom(network.RTC[config.NETWORK]);
  return Tx.fromTxData(txObject, {
    common,
  });
};

const withdraw = async (from, to, account, amount) => {
  const myContract = await getJointAccountContractInstance(account);
  // const adminShare = await getAdminShare(account);

  await confirmMember(account, from);
  await confirmRole(account, from, ['ADMIN_ROLE', 'WITHDRAW_ROLE']);
  await checkBalance(account, amount, RTO);
  // await checkBalance(from, adminShare, RTC);

  const decimals = await getDecimals(RTO);
  const nonce_count = await getNonce(RTO, from);
  // const value = getBigNumberObject(adminShare, decimals);
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods
    .p2pTransfer(account, to, amountInHex, false)
    .estimateGas({
      from,
    });
  const data = await myContract.methods.p2pTransfer(account, to, amountInHex, false).encodeABI();

  const txObject = {
    from,
    to: account,
    nonce: await web3.utils.toHex(nonce_count),
    gasPrice: '0x0',
    gasLimit: await web3.utils.toHex(gasLimit),
    data,
  };
  const common = Common.custom(network.RTC[config.NETWORK]);
  return Tx.fromTxData(txObject, {
    common,
  });
};

const changeStatus = async (from, account, isDeleted) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);

  const gasLimit = await myContract.methods.updateAccountStatus(isDeleted).estimateGas({
    from,
  });
  const data = await myContract.methods.updateAccountStatus(isDeleted).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const withdrawFull = async (from, account) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);

  const gasLimit = await myContract.methods.withdrawBalance().estimateGas({
    from,
  });
  const data = await myContract.methods.withdrawBalance().encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const changeOwner = async (from, account, newOwner) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);
  await confirmMember(account, newOwner);

  const gasLimit = await myContract.methods.transferOwnership(newOwner).estimateGas({
    from,
  });
  const data = await myContract.methods.transferOwnership(newOwner).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const changeRootAdmin = async (from, account, newOwner) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE']);

  const gasLimit = await myContract.methods.changeRootAdmin(newOwner).estimateGas({
    from,
  });
  const data = await myContract.methods.changeRootAdmin(newOwner).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const approve = async (from, account, amount) => {
  const myContract = await getJointAccountContractInstance(account);

  await confirmRole(account, from, ['ADMIN_ROLE', 'WITHDRAW_ROLE']);
  await checkBalance(account, amount, RTO);

  const decimals = await getDecimals(RTO);
  const amountInHex = getBigNumberObject(amount, decimals);
  const gasLimit = await myContract.methods
    .approve(contracts.PAYMENT.address, amountInHex)
    .estimateGas({
      from,
    });
  const data = await myContract.methods.approve(contracts.PAYMENT.address, amountInHex).encodeABI();
  const txn = await buildTransaction(from, account, gasLimit, data);
  return txn;
};

const getMembers = async (account) => {
  const myContract = await getJointAccountContractInstance(account);
  const data = await myContract.methods.getMembers().call();
  return data;
};

const getMembersCount = async (account) => {
  const myContract = await getJointAccountContractInstance(account);
  const data = await myContract.methods.getMembersCount().call();
  return data;
};

const getInvites = async (account) => {
  const myContract = await getJointAccountContractInstance(account);
  const data = await myContract.methods.getInvites().call();
  return data;
};

const getOwner = async (account) => {
  const myContract = await getJointAccountContractInstance(account);
  const data = await myContract.methods.owner().call();
  return data;
};

const getAdminShare = async (account) => {
  const myContract = await getJointAccountContractInstance(account);
  const share = await myContract.methods.getAdminShare().call();
  const decimals = await getDecimals(RTO);
  const data = processValue(share, decimals);
  return data;
};

const isMember = async (account, member) => {
  const myContract = await getJointAccountContractInstance(account);
  const data = await myContract.methods.isMember(member).call();
  return data;
};

const isMembers = async (account, members) => {
  const promises = members.map((member) => {
    return isMember(account, member);
  });
  const promiseStatus = await Promise.all(promises);
  const status = promiseStatus.includes(true);
  if (status) {
    throw new Error('EXISTING_MEMBER');
  }
  return true;
};

const hasRole = async (account, member, role) => {
  const myContract = await getJointAccountContractInstance(account);
  const roleCode = await getRoleCode(role, account);
  const data = await myContract.methods.hasRole(roleCode, member).call();
  return data;
};

const confirmMember = async (account, member) => {
  if (!(await isMember(account, member))) {
    throw new Error('UNKNOWN_MEMBER');
  }
  return true;
};

const confirmInvitation = async (account, member) => {
  let invites = await getInvites(account);
  invites = invites.map((member) => member.toLowerCase());
  if (!invites.includes(member.toLowerCase())) {
    throw new Error('NOT_INVITED');
  } else if (await isMember(account, member)) {
    throw new Error('EXISTING_MEMBER');
  }
  return true;
};

const confirmNotInvited = async (account, members) => {
  const invites = await getInvites(account);
  members = members.map((member) => member.toLowerCase());
  const found = invites.some((r) => members.indexOf(r.toLowerCase()) >= 0);
  if (found) {
    throw new Error('INVITED');
  }
  return true;
};

const confirmRole = async (account, member, roles) => {
  const promises = roles.map((role) => {
    return hasRole(account, member, role);
  });
  const promiseStatus = await Promise.all(promises);
  const status = promiseStatus.includes(true);
  if (!status) {
    throw new Error('UNKNOWN_ROLE');
  }
  return true;
};

module.exports = {
  createNewAccount,
  getAccountAddress,
  deposit,
  withdraw,
  inviteMembers,
  removeMember,
  acceptJoinRequest,
  rejectJoinRequest,
  grantRole,
  revokeRole,
  changeStatus,
  withdrawFull,
  getMembers,
  getMembersCount,
  getInvites,
  getOwner,
  changeOwner,
  changeRootAdmin,
  approve,
  // upgrade,
};
