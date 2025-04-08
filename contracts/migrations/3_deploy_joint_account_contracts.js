const JointAccount = artifacts.require('JointAccount');
const JointAccountFactory = artifacts.require('JointAccountFactory');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const OWNER_ADDRESS = process.env.OWNER_ADDRESS;

module.exports = async function (deployer) {
  await deployer.deploy(JointAccount);
  console.log('Deployed Joint Account Implementation address :', JointAccount.address);

  const JointAccountFactoryInstance = await deployProxy(
    JointAccountFactory,
    [JointAccount.address, OWNER_ADDRESS],
    {
      deployer,
    }
  );
  console.log(
    'Deployed Joint Account Factory Contract address : ',
    JointAccountFactoryInstance.address
  );
};
