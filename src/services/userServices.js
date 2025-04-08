import contracts from '../constants/contractDetails.js';
import config from '../config/env';
import { getContractInstance, isUser, verifyUser, confirmAdmin } from './commonServices';
import { signTxnWithKMS } from './transactionServices';
import { getUserProposalCount } from './lendingServices';
import users from '../constants/users.json';
import web3 from './web3';

const PROPOSAL = 'PROPOSAL';

const createUser = async (from, user) => {
  const myContract = await getContractInstance(PROPOSAL);

  if (await isUser(user)) {
    throw new Error('EXISTING_USER');
  }
  await confirmAdmin(from, PROPOSAL);

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.createUser(user).estimateGas({
    from,
  });
  const data = await myContract.methods.createUser(user).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const deleteUser = async (from, user) => {
  const myContract = await getContractInstance(PROPOSAL);

  await verifyUser(user);
  await confirmAdmin(from, PROPOSAL);
  if ((await getUserProposalCount(user)) !== '0') {
    throw new Error('ACTIVE_USER');
  }

  const to = contracts[PROPOSAL].address;
  const gasLimit = await myContract.methods.deleteUser(user).estimateGas({
    from,
  });
  const data = await myContract.methods.deleteUser(user).encodeABI();
  const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
  return serializedTx;
};

const getUserCount = async () => {
  const myContract = await getContractInstance(PROPOSAL);
  const data = await myContract.methods.getUserCount().call();
  return data;
};

const getUserAddressAtIndex = async (index) => {
  const myContract = await getContractInstance(PROPOSAL);

  const count = await getUserCount();
  if (index >= count) {
    throw new Error('INVALID_INDEX');
  }

  const data = await myContract.methods.getUserAddressAtIndex(index).call();
  return data;
};

const getUserDetailsByAddress = async (user) => {
  const myContract = await getContractInstance(PROPOSAL);

  await verifyUser(user);

  const data = await myContract.methods.getUserDetailsByAddress(user).call({ from: user });
  return data;
};

const preRegisterUsers = async () => {
  const myContract = await getContractInstance(PROPOSAL);
  const { rejectedUsers, unregisteredUsers } = await filterUsers();
  if (unregisteredUsers.length) {
    const to = contracts[PROPOSAL].address;
    const from = config.ADMIN_ADDRESS;
    const gasLimit = await myContract.methods.addUsers(unregisteredUsers).estimateGas({
      from,
    });
    const data = await myContract.methods.addUsers(unregisteredUsers).encodeABI();
    const serializedTx = await signTxnWithKMS(from, to, gasLimit, data, 'ADMIN');
    await web3.eth.sendSignedTransaction(serializedTx);
  }

  return rejectedUsers;
};

const filterUsers = async () => {
  const unregisteredUsers = [...new Set(users)];
  const rejectedUsers = [];
  const promiArray = [];
  users.forEach((user) => {
    promiArray.push(isUser(user));
  });
  const promiResp = await Promise.allSettled(promiArray);
  promiResp.forEach((resp, i) => {
    if (resp.value) {
      rejectedUsers.push(users[i]);
      const index = unregisteredUsers.indexOf(users[i]);
      unregisteredUsers.splice(index, 1);
    }
  });
  return { rejectedUsers, unregisteredUsers };
};

module.exports = {
  createUser,
  deleteUser,
  getUserCount,
  getUserAddressAtIndex,
  getUserDetailsByAddress,
  preRegisterUsers,
};
