// const Swapper = artifacts.require('SwapperV5');
// const { upgradeProxy, forceImport } = require('@openzeppelin/truffle-upgrades');

// const SwapperV6 = artifacts.require('SwapperV6'); //  new file name

// module.exports = async function (deployer) {
//   const existingInstance = await Swapper.deployed();
//   // await forceImport(existingInstance.address, Swapper, {
//   //   kind: 'transparent',
//   // });

//   // console.log("Existing Instance Address",existingInstance.address);

//   const newInstance = await upgradeProxy('0x80A80e168ce39FE96d5f72907185ebDeB253283A', SwapperV6, {
//     deployer,
//   });
//   console.log('Upgraded swapper contract Address : ', newInstance.address);
// };
