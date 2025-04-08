const JointAccountV2 = artifacts.require('JointAccountV3');
const JointAccountFactory = artifacts.require('JointAccountFactory');
const JointAccountBeacon = artifacts.require('JointAccountBeacon');

const OWNER_ADDRESS = process.env.OWNER_ADDRESS;

module.exports = async function (deployer) {
  await deployer.deploy(JointAccountV2);
  const JointAccountV2Implementation = await JointAccountV2.deployed();
  await JointAccountV2Implementation.transferOwnership(OWNER_ADDRESS);
  console.log(
    'Deployed Joint Account New Implementation address :',
    JointAccountV2Implementation.address
  );

  const JointAccountFactoryInstance = await JointAccountFactory.deployed();
  console.log(
    'Deployed Joint Account Factory Contract address : ',
    JointAccountFactoryInstance.address
  );

  const JointAccountBeaconAddress = await JointAccountFactoryInstance.getBeacon();
  console.log('Deployed Joint Account Beacon Contract address : ', JointAccountBeaconAddress);

  const JointAccountBeaconInstance = await JointAccountBeacon.at(JointAccountBeaconAddress);

  console.log('Upgrading...');

  await JointAccountBeaconInstance.update(JointAccountV2Implementation.address);
  await JointAccountBeaconInstance.transferOwnership(OWNER_ADDRESS);

  console.log('Joint Account updated successfully!');
};
