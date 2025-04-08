const WrappedToken = artifacts.require('WrappedToken');
const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const DECIMALS = process.env.DECIMALS;

const TOKEN_ADMINS = {
  WERTC: process.env.WERTC_ADMIN_ADDRESS,
  WETH: process.env.WETH_ADMIN_ADDRESS,
  WUSDT: process.env.WUSDT_ADMIN_ADDRESS,
  WUSDC: process.env.WUSDC_ADMIN_ADDRESS,
  WBNB: process.env.WBNB_ADMIN_ADDRESS,
  WBTC: process.env.WBTC_ADMIN_ADDRESS,
};

module.exports = async function (deployer) {
  // const instanceWERTC = await deployProxy(
  //   WrappedToken,
  //   ['Wrapped Ethereum RTC', 'WERTC', DECIMALS],
  //   {
  //     deployer,
  //   }
  // );
  // await instanceWERTC.transferOwnership(TOKEN_ADMINS.WERTC);
  // console.log('Deployed Wrapped Ethereum RTC address : ', instanceWERTC.address);

  const instanceWETH = await deployProxy(WrappedToken, ['Wrapped ETH', 'WETH', DECIMALS], {
    deployer,
  });
  await instanceWETH.transferOwnership(TOKEN_ADMINS.WETH);
  console.log('Deployed Wrapped ETH address : ', instanceWETH.address);

  const instanceWUSDT = await deployProxy(WrappedToken, ['Wrapped USDT', 'WUSDT', DECIMALS], {
    deployer,
  });
  await instanceWUSDT.transferOwnership(TOKEN_ADMINS.WUSDT);
  console.log('Deployed Wrapped USDT address : ', instanceWUSDT.address);

  const instanceUSDC = await deployProxy(WrappedToken, ['Wrapped Ethereum', 'WUSDC', DECIMALS], {
    deployer,
  });
  await instanceUSDC.transferOwnership(TOKEN_ADMINS.WUSDC);
  console.log('Deployed Wrapped USDC address : ', instanceUSDC.address);

  const instanceBNB = await deployProxy(WrappedToken, ['Wrapped BNB', 'WBNB', DECIMALS], {
    deployer,
  });
  await instanceBNB.transferOwnership(TOKEN_ADMINS.WBNB);
  console.log('Deployed Wrapped BNB address : ', instanceBNB.address);

  const instanceBTC = await deployProxy(WrappedToken, ['Wrapped Bitcoin', 'WBTC', DECIMALS], {
    deployer,
  });
  await instanceBTC.transferOwnership(TOKEN_ADMINS.WBTC);
  console.log('Deployed Wrapped BTC address : ', instanceBTC.address);
};
