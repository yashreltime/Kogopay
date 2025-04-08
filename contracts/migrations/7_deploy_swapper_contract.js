const MarketRateOracle = artifacts.require('MarketRateOracleV2');
const Swapper = artifacts.require('Swapper');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const { OWNER_ADDRESS, LINK_TOKEN_ADDRESS } = process.env;

module.exports = async function (deployer) {
  // Provide Link Token Address
  await deployer.deploy(MarketRateOracle, LINK_TOKEN_ADDRESS);
  const MarketRateOracleInstance = await MarketRateOracle.deployed();
  await MarketRateOracleInstance.transferOwnership(OWNER_ADDRESS);
  console.log('Deployed Market Rate Oracle address : ', MarketRateOracle.address);

  // const SwapperInstance = await deployProxy(Swapper, [MarketRateOracle.address], {
  //   deployer,
  // });
  // await SwapperInstance.transferOwnership(OWNER_ADDRESS);
  // console.log('Deployed Swapper Contract address : ', SwapperInstance.address);
};
