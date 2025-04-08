const Swapper = artifacts.require('Swapper');
const { upgradeProxy, forceImport } = require('@openzeppelin/truffle-upgrades');

const SwapperV2 = artifacts.require('SwapperV2'); //  new file name

module.exports = async function (deployer) {
  // const existingInstance = await Swapper.deployed();
  // await forceImport(existingInstance.address, Swapper, {
  //   kind: 'transparent',
  // });

  const newInstance = await upgradeProxy('0xC99d6e8CF8CAb8825E161CAC60E45050a26277e5', SwapperV2, {
    deployer,
  });
  console.log('Upgraded swapper contract Address : ', newInstance.address);
};
