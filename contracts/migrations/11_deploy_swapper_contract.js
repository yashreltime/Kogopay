const Swapper = artifacts.require('SwapperV5');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const OWNER_ADDRESS = process.env.OWNER_ADDRESS;
const MARKETRATE_ORACLE_ADDRESS = process.env.MARKETRATE_ORACLE_ADDRESS;

module.exports = async function (deployer) {
  // Provide Market Rate Oracle Address
  console.log('Market Rate Oracle address : ', MARKETRATE_ORACLE_ADDRESS);

  const SwapperInstance = await deployProxy(Swapper, [MARKETRATE_ORACLE_ADDRESS], {
    deployer,
  });
  await SwapperInstance.transferOwnership(OWNER_ADDRESS);
  console.log('Deployed Swapper Contract address : ', SwapperInstance.address);
};
